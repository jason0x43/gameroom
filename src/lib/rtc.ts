import { cameras } from './stores';

export function stopStream(stream: MediaStream) {
	stream.getTracks().forEach((track) => track.stop());
}

export function openStream(cameraId: string, minWidth: number, minHeight: number) {
	return navigator.mediaDevices.getUserMedia({
		audio: { echoCancellation: true },
		video: {
			deviceId: cameraId,
			width: { min: minWidth },
			height: { min: minHeight }
		}
	});
}

export async function loadCameras() {
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: false,
		video: true
	});
	stopStream(stream);

	const devices = await navigator.mediaDevices.enumerateDevices();
	const cams = devices.filter((device) => device.kind === 'videoinput');
	cameras.set(cams);
}

// export function playVideo(cameraId: string) {
// 	try {
// 		const videoElement = document.querySelector('video#local-stream') as HTMLVideoElement;
// 		const width = videoElement.clientWidth;
// 		const height = videoElement.clientHeight;
// 		const stream = await getStream(cameraId, width, height);
// 		videoElement.srcObject = stream;
// 		startPeerListener(stream);
// 		return stream;
// 	} catch (error) {
// 		console.error('Error opening video camera.', error);
// 	}
// }

// export async function getCameras() {
// 	const cameras = await getConnectedDevices('videoinput');
// 	const cameraSelect = document.querySelector('#cameras');

// 	for (const camera of cameras) {
// 		const option = document.createElement('option');
// 		option.textContent = camera.label;
// 		option.value = camera.deviceId;
// 		cameraSelect.append(option);
// 	}
// }

async function startPeerListener(stream: MediaStream) {
	const peerConnection = new RTCPeerConnection({
		iceServers: [],
		iceTransportPolicy: 'all',
		iceCandidatePoolSize: 0
	});

	peerConnection.addEventListener('icecandidate', (event) => {
		if (event.candidate) {
			console.log('icecandidate:', event.candidate.address);
		}
	});

	if (stream) {
		stream.getTracks().forEach((track) => {
			peerConnection.addTrack(track, stream);
		});
	}

	const desc = await peerConnection.createOffer({ offerToReceiveAudio: true });
	peerConnection.setLocalDescription(desc);

	console.log('Listening for peers...');
}
