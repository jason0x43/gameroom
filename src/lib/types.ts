export type Peer = {
	id: string;
	userId: string;
	name?: string;
	remove?: boolean;
};

export type PeerMessage = {
	type: 'peer';
	data: Peer;
};

export type Candidate = {
		id: string;
		target: string;
		candidate: RTCIceCandidateInit;
};

export type CandidateMessage = {
	type: 'candidate';
	data: Candidate;
};

export type Offer = {
		/** the offeror */
		source: string;
		/** the target of the offer */
		target: string;
		sdp: string;
};

export type OfferMessage = {
	type: 'offer';
	data: Offer;
};

export type Answer = Offer;

export type AnswerMessage = {
	type: 'answer';
	data: Answer;
};

export type Message = PeerMessage | CandidateMessage | OfferMessage | AnswerMessage;
