import { describe, expect, it } from 'vitest';
import { parsePlayerId } from '$lib/playerId';
import { localDateInTimezone } from './localDate';

describe('localDateInTimezone', () => {
	it('returns a YYYY-MM-DD date', () => {
		expect(localDateInTimezone('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(localDateInTimezone('America/Los_Angeles')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe('parsePlayerId', () => {
	it('keeps a valid uuid', () => {
		const id = '11111111-1111-4111-8111-111111111111';
		expect(parsePlayerId(id)).toBe(id);
	});

	it('replaces missing or invalid values', () => {
		expect(parsePlayerId(null)).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
		);
		expect(parsePlayerId('not-a-uuid')).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
		);
	});
});
