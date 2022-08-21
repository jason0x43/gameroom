import type { User } from '@prisma/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	return {
		user: locals.user as User
	};
};
