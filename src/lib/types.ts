export type Peer = {
	name: string;
	sdp: string;
};

export type Message<T = unknown> = {
	type: string;
	value: T;
};

export type PeerMessage = Message<{
	name: string;
	sdp: string;
}> & {
	type: 'peer';
};

export function isPeerMessage(msg: Message): msg is PeerMessage {
	return msg.type === 'peer';
}
