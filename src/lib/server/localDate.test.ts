import { describe, expect, it } from 'vitest';
import { parsePlayerId } from '$lib/playerId';
import { localDateInTimezone } from './localDate';

describe('localDateInTimezone', () => {
	it('returns a YYYY-MM-DD date', () => {
		expect(localDateInTimezone('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(localDateInTimezone('America/Los_Angeles')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('rejects invalid timezones', () => {
		expect(() => localDateInTimezone('Not/AZone')).toThrow('Invalid timezone');
		expect(() => localDateInTimezone('')).toThrow('Invalid timezone');
	});
});

describe('parsePlayerId', () => {
	it('keeps a valid uuid', () => {
		const id = '11111111-1111-4111-8111-111111111111';
		expect(parsePlayerId(id)).toBe(id);
	});

	it('rejects missing or invalid values', () => {
		expect(parsePlayerId(null)).toBeNull();
		expect(parsePlayerId('not-a-uuid')).toBeNull();
	});
});
