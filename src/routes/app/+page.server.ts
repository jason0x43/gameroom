import type { User } from '$lib/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	return {
		user: locals.user as User
	};
};
