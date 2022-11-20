import { getSession } from '$lib/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const session = await getSession(event.request.headers.get('cookie'));
  event.locals.user = session?.user;
  return await resolve(event);
};
