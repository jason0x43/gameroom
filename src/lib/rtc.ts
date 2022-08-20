import type { Answer, Candidate, Message, Offer, Peer } from './types';
import { v4 as uuid } from 'uuid';

type Handler<T = unknown> = (event: T) => void;

type RtcEvent = {
	peerschanged: undefined;
	connected: undefined;
	disconnected: undefined;
	streamopened: MediaStream;
	offer: Offer;
	error: Error;
};

type RtcEventName = keyof RtcEvent;
type NonDataRtcEventName = {
	[K in keyof RtcEvent]: RtcEvent[K] extends undefined ? K : never;
}[keyof RtcEvent];
type DataRtcEventName = {
	[K in keyof RtcEvent]: RtcEvent[K] extends undefined ? never : K;
}[keyof RtcEvent];

export class WebRTCClient {
	#socket: WebSocket | undefined;
	#stream: MediaStream | undefined;
	#minWidth = 720;
	#minHeight = 405;
	#peerConnections = new Map<string, RTCPeerConnection>();
	#peerIceCandidates = new Map<string, RTCIceCandidateInit[]>();
	#peers = new Map<string, Peer>();
	#listeners = new Map<RtcEventName, Set<Handler>>();
	#connected: Promise<void>;
	#id: string;
	#name: string | undefined;

	constructor() {
		const protocol = window.location.protocol.startsWith('https') ? 'wss' : 'ws';
		const loc = `${protocol}://${window.location.host}/ss`;
		const socket = new WebSocket(loc);
		this.#socket = socket;

		this.#connected = new Promise((resolve) => {
			socket.onopen = () => {
				resolve();
			};
		});

		socket.onopen = () => {
			this.#emit('connected');
		};

		socket.onmessage = (event) => {
			this.#handleMessage(event);
		};

		socket.onerror = (event) => {
			this.#emit('error', new Error(`${event}`));
			console.warn('socket error:', event);
		};

		socket.onclose = () => {
			this.#emit('disconnected');
			this.#socket = undefined;
		};

		this.#id = uuid();
	}

	/**
	 * A promise the resolves when the client has connected to the signal server.
	 */
	get connected(): Promise<void> {
		return this.#connected;
	}

	/**
	 * The client's unique ID.
	 */
	get id(): string {
		return this.#id;
	}

	/**
	 * The client's display name.
	 *
	 * This defaults to the client's unique ID.
	 */
	get name(): string {
		return this.#name ?? this.#id;
	}

	/**
	 * Set the client's display name.
	 *
	 * The signal server will be notified of the new name.
	 */
	set name(value: string) {
		this.#name = value;
		this.#send({
			type: 'peer',
			data: {
				id: this.#id,
				name: value
			}
		});
	}

	get peers(): Peer[] {
		return Array.from(this.#peers.values());
	}

	/**
	 * Listen for RTC events
	 */
	on<T extends RtcEventName, H extends Handler<RtcEvent[T]>>(eventName: T, handler: H) {
		const handlers = (this.#listeners.get(eventName) as Set<H>) ?? new Set<H>();
		this.#listeners.set(eventName, handlers as Set<Handler>);
		handlers.add(handler);
		return () => {
			handlers.delete(handler);
		};
	}

	/**
	 * Close this client
	 */
	close(): void {
		this.#socket?.close();
		this.#listeners.clear();
		this.#peers.clear();
		this.closeStream();
	}

	/**
	 * Open a camera stream.
	 */
	async openStream(cameraId?: string): Promise<MediaStream> {
		this.#stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true },
			video: {
				deviceId: cameraId,
				width: { min: this.#minWidth },
				height: { min: this.#minHeight }
			}
		});
		return this.#stream;
	}

	/**
	 * Close the currently open camera stream.
	 */
	closeStream(): void {
		this.#stream?.getTracks().forEach((track) => track.stop());
		this.#stream = undefined;
	}

	/**
	 * Invite a peer to connect.
	 */
	async invite(peerId: string): Promise<void> {
		if (!this.#stream) {
			throw new Error('Stream must be open to issue an invitation');
		}

		if (this.#peerConnections.has(peerId)) {
			throw new Error(`Already connected to ${peerId}`);
		}

		const peerConnection = new RTCPeerConnection({
			iceServers: [],
			iceTransportPolicy: 'all',
			iceCandidatePoolSize: 0
		});
		this.#peerConnections.set(peerId, peerConnection);

		peerConnection.onicecandidate = (event) => {
			const candidate = event.candidate;
			if (candidate) {
				this.#send({
					type: 'candidate',
					data: {
						id: this.#id,
						target: peerId,
						candidate
					}
				});
			}
		};

		peerConnection.ontrack = (event) => {
			this.#emit('streamopened', event.streams[0]);
		};

		for (const track of this.#stream.getTracks()) {
			peerConnection.addTrack(track, this.#stream);
		}

		const offer = await peerConnection.createOffer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		});

		if (!offer.sdp) {
			throw new Error('Unable to generate offer');
		}

		await peerConnection.setLocalDescription(offer);

		this.#send({
			type: 'offer',
			data: {
				source: this.#id,
				target: peerId,
				sdp: offer.sdp
			}
		});
	}

	/**
	 * Accept a peer invite
	 */
	async accept(offer: Offer): Promise<void> {
		if (!this.#stream) {
			throw new Error('Stream must be open to accept an invitation');
		}

		if (this.#peerConnections.has(offer.source)) {
			throw new Error(`Already connected to ${offer.source}`);
		}

		const peerConnection = new RTCPeerConnection({
			iceServers: [],
			iceTransportPolicy: 'all',
			iceCandidatePoolSize: 0
		});
		this.#peerConnections.set(offer.source, peerConnection);

		peerConnection.onicecandidate = (event) => {
			console.log('candidate:', event.candidate);
			const candidate = event.candidate;
			if (candidate) {
				this.#send({
					type: 'candidate',
					data: {
						id: this.#id,
						target: offer.source,
						candidate,
					}
				});
			}
		};

		peerConnection.setRemoteDescription({
			type: 'offer',
			sdp: offer.sdp
		});

		for (const track of this.#stream.getTracks()) {
			peerConnection.addTrack(track, this.#stream);
		}

		const answer = await peerConnection.createAnswer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		});

		if (!answer.sdp) {
			throw new Error('Unable to generate answer');
		}

		await peerConnection.setLocalDescription(answer);

		this.#send({
			type: 'answer',
			data: {
				source: offer.source,
				target: this.#id,
				sdp: answer.sdp
			}
		});

		const candidates = this.#peerIceCandidates.get(offer.source);
		for (const candidate of candidates ?? []) {
			try {
				await peerConnection.addIceCandidate(candidate);
			} catch (error) {
				console.warn(`Error adding ICE candidate ${candidate}: ${error}`);
			}
		}
	}

	/**
	 * Disconnect from a peer.
	 */
	disconnect(peerId: string): void {
		const peerConnection = this.#peerConnections.get(peerId);
		if (peerConnection) {
			peerConnection.close();
			this.#peerConnections.delete(peerId);
		}
		this.#peerIceCandidates.delete(peerId);
	}

	/**
	 * Get the available cameras.
	 */
	async getCameras(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter((device) => device.kind === 'videoinput');
	}

	/**
	 * Add an ICE candidate for a specific peer.
	 */
	async #addIceCandidate(candidate: Candidate) {
		const candidates = this.#peerIceCandidates.get(candidate.id) ?? [];
		this.#peerIceCandidates.set(candidate.id, candidates);
		candidates.push(candidate.candidate);

		const peerConnection = this.#peerConnections.get(candidate.id);
		try {
			peerConnection?.addIceCandidate(candidate.candidate);
		} catch (error) {
			console.warn(`Error adding ICE candidate ${candidate}: ${error}`);
		}
	}

	/**
	 * Connect to a peer that has answered an offer.
	 */
	#connectToPeer(answer: Answer) {
		const peerConnection = this.#peerConnections.get(answer.target);
		if (!peerConnection) {
			throw new Error(`No active peer connection for ${answer.target}`);
		}

		peerConnection.setRemoteDescription({
			type: 'answer',
			sdp: answer.sdp
		});
	}

	/**
	 * Emit an RTC event.
	 */
	#emit<T extends NonDataRtcEventName>(eventName: T): void;
	#emit<T extends DataRtcEventName>(eventName: T, data: RtcEvent[T]): void;
	#emit<T extends RtcEventName>(eventName: T, data?: RtcEvent[T]): void {
		this.#listeners.get(eventName)?.forEach((listener) => listener(data));
	}

	/**
	 * Handle an incoming signal server message.
	 */
	#handleMessage(event: MessageEvent): void {
		const msg = JSON.parse(event.data) as Message;
		console.log(`Received [${msg.type}]`, msg);

		switch (msg.type) {
			case 'peer':
				if (msg.data.remove) {
					this.#peers.delete(msg.data.id);
				} else {
					this.#peers.set(msg.data.id, msg.data);
				}
				this.#emit('peerschanged');
				break;

			case 'offer': {
				this.#emit('offer', msg.data);
				break;
			}

			case 'answer': {
				this.#connectToPeer(msg.data);
				break;
			}

			case 'candidate': {
				this.#addIceCandidate(msg.data);
				break;
			}
		}
	}

	/**
	 * Send a message to the signal server
	 */
	#send(message: Message): void {
		if (!this.#socket) {
			throw new Error('Client is not connected');
		}
		this.#socket.send(JSON.stringify(message));
		console.log(`Sent [${message.type}]`);
	}
}
