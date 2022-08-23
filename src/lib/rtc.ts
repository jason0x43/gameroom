import type {
	Answer,
	Candidate,
	Message,
	Offer,
	Peer,
} from './types';
import { v4 as uuid } from 'uuid';

type Handler<T = unknown> = (event: T) => void;

type RtcEvent = {
	peeradded: Peer;
	peerupdated: Peer;
	peerremoved: Peer;
	peerconnected: {
		stream: MediaStream;
		peer: Peer;
	};
	connected: undefined;
	disconnected: undefined;
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
	#peerConnections = new Map<string, RTCPeerConnection>();
	#peerIceCandidates = new Map<string, RTCIceCandidateInit[]>();
	#peers = new Map<string, Peer>();
	#listeners = new Map<RtcEventName, Set<Handler>>();
	#id: string;
	#name: string | undefined;
	#userId: string;
	#closed = false;
	#reconnectTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(userId: string) {
		this.#userId = userId;
		this.#id = uuid();
		this.#connect();
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
	}

	get peers(): Peer[] {
		return Array.from(this.#peers.values());
	}

	/**
	 * Listen for RTC events
	 */
	on<T extends RtcEventName, H extends Handler<RtcEvent[T]>>(
		eventName: T,
		handler: H
	) {
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
		clearTimeout(this.#reconnectTimer);
		this.#closed = true;
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
			video: { deviceId: cameraId }
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
		const peerConnection = this.#createPeerConnection(peerId);

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
		const peerId = offer.source;
		const peerConnection = this.#createPeerConnection(peerId);

		peerConnection.setRemoteDescription({
			type: 'offer',
			sdp: offer.sdp
		});
		console.debug(`Set remote description to ${offer.sdp}`);

		const answer = await peerConnection.createAnswer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		});

		if (!answer.sdp) {
			throw new Error('Unable to generate answer');
		}

		await peerConnection.setLocalDescription(answer);
		console.debug('Set local description to', answer);

		this.#send({
			type: 'answer',
			data: {
				source: offer.source,
				target: this.#id,
				sdp: answer.sdp
			}
		});
		console.debug('Sent answer to offeror');

		const candidates = this.#peerIceCandidates.get(offer.source);
		for (const candidate of candidates ?? []) {
			try {
				await peerConnection.addIceCandidate(candidate);
				console.debug('Adding candidate', candidate, 'to peer connection');
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
		console.debug('Received candidate:', candidate);
		const candidates = this.#peerIceCandidates.get(candidate.id) ?? [];
		this.#peerIceCandidates.set(candidate.id, candidates);
		candidates.push(candidate.candidate);

		try {
			this.#peerConnections
				.get(candidate.id)
				?.addIceCandidate(candidate.candidate);
		} catch (error) {
			console.warn(`Error adding ICE candidate ${candidate}: ${error}`);
		}
	}

	/**
	 * Connect to the signal server
	 */
	#connect() {
		const protocol = window.location.protocol.startsWith('https')
			? 'wss'
			: 'ws';
		const loc = `${protocol}://${window.location.host}/ss`;

		const socket = new WebSocket(loc);
		this.#socket = socket;

		socket.onopen = () => {
			console.log('Connected to signal server');
			this.#emit('connected');
			socket.send(
				JSON.stringify({
					type: 'peer',
					data: {
						id: this.#id,
						userId: this.#userId
					}
				})
			);
		};

		socket.onmessage = (event) => {
			this.#handleMessage(event);
		};

		socket.onerror = (event) => {
			this.#emit('error', new Error(`${event}`));
			console.warn('Socket error:', event);
		};

		socket.onclose = () => {
			this.#socket = undefined;
			this.#emit('disconnected');
			console.debug('Socket closed');

			if (!this.#closed) {
				this.#reconnect();
			}
		};
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
	 * Create a new peer connection
	 */
	#createPeerConnection(peerId: string) {
		if (!this.#stream) {
			throw new Error('Stream must be open to create a peer connection');
		}

		if (this.#peerConnections.has(peerId)) {
			throw new Error(`Already connected to ${peerId}`);
		}

		const peer = this.#peers.get(peerId);
		if (!peer) {
			throw new Error(`Unknown peer ${peerId}`);
		}

		const peerConnection = new RTCPeerConnection({
			iceServers: [],
			iceTransportPolicy: 'all',
			iceCandidatePoolSize: 0
		});

		this.#peerConnections.set(peerId, peerConnection);
		console.debug(`Added peer connection for ${peerId}`);

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
			console.debug('Received remote stream');
			this.#emit('peerconnected', {
				stream: event.streams[0],
				peer
			});
		};

		for (const track of this.#stream.getTracks()) {
			peerConnection.addTrack(track, this.#stream);
			console.debug('Added local stream track to peer connection');
		}

		return peerConnection;
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
		console.debug(`Received [${msg.type}]`, msg);

		switch (msg.type) {
			case 'peer':
				if (msg.data.remove) {
					this.#peers.delete(msg.data.id);
					this.#emit('peerremoved', msg.data);
				} else {
					const event = this.#peers.has(msg.data.id)
						? 'peerupdated'
						: 'peeradded';
					this.#peers.set(msg.data.id, msg.data);
					this.#emit(event, msg.data);
				}
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
	 * Attempt to reconnect to the signal server
	 */
	#reconnect(): void {
		clearTimeout(this.#reconnectTimer);
		this.#reconnectTimer = setTimeout(() => {
			if (this.#socket) {
				return;
			}

			console.debug('Attempting reconnect...');
			this.#connect();
		}, 1000);
	}

	/**
	 * Send a message to the signal server
	 */
	#send(message: Message): void {
		if (!this.#socket) {
			throw new Error('Client is not connected');
		}
		this.#socket.send(JSON.stringify(message));
	}
}
