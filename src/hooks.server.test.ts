import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { handle } from './hooks.server.js';

vi.mock('cookie', () => {
	return {
		parse: vi.fn(() => {
			return {
				session: 'bar'
			};
		})
	};
});

vi.mock('$lib/session', () => {
	return {
		getSession: vi.fn(async () => {
			return {
				id: 'session-id',
				user: {
					id: 'user-id',
					username: 'foo'
				}
			};
		})
	};
});

describe('hooks', () => {
	describe('handle', () => {
		it('sets the session', async () => {
			const event = {
				request: {
					headers: new Headers()
				},
				locals: {}
			} as RequestEvent;
			const resolve = vi.fn(
				(event: RequestEvent) =>
					({
						resolvedEvent: event
					} as unknown as Response)
			);
			const resolved = await handle({ event, resolve });
			expect(resolve).toHaveBeenCalled();
			expect(resolved).toBeDefined();
			expect(resolved).toEqual(resolve.mock.results[0].value);
			const resolvedEvent = resolve.mock.calls[0][0];
			expect(resolvedEvent.locals.user).toEqual({
				id: 'user-id',
				username: 'foo'
			});
		});
	});
});
