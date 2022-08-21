import type { Session } from '@prisma/client';
import * as cookie from 'cookie';
import { getSessionWithUser, type SessionWithUser } from './db/session';

const options = {
	path: '/',
	httpOnly: true,
	sameSite: 'strict' as const,
	secure: process.env.NODE_ENV === 'production'
};

export async function getSession(
	cookieStr: string | null
): Promise<SessionWithUser | undefined> {
	if (!cookieStr) {
		return undefined;
	}
	const cookies = cookie.parse(cookieStr);
	return (await getSessionWithUser(cookies.session)) ?? undefined;
}

export function createSessionCookie(session: Session): string {
	return cookie.serialize('session', session.id, {
		...options,
		expires: new Date(session.expires)
	});
}

export function getSessionId(cookieStr: string | null): string | undefined {
	if (!cookieStr) {
		return undefined;
	}
	const cookies = cookie.parse(cookieStr);
	return cookies.session;
}

export function clearSessionCookie(): string {
	return cookie.serialize('session', '', {
		...options,
		expires: new Date(0)
	});
}
