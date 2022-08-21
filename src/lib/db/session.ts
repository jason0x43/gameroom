import { prisma } from '$lib/db';
import type { Session, User } from '@prisma/client';

export type SessionWithUser = Session & {
	user: User;
};

export async function getSessionWithUser(
	id: Session['id']
): Promise<SessionWithUser | null> {
	if (!id) {
		return null;
	}

	return await prisma.session.findUnique({
		where: {
			id
		},
		include: {
			user: true
		}
	});
}

export async function createUserSession(userId: User['id']): Promise<Session> {
	return await prisma.session.create({
		data: {
			userId,
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
		}
	});
}
