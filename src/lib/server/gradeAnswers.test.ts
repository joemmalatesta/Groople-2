import { describe, expect, it } from 'vitest';
import { startsWithRequiredLetter } from './letterCheck';

describe('startsWithRequiredLetter', () => {
	it('accepts answers that start with the required letter', () => {
		expect(startsWithRequiredLetter('Alex', 'A')).toBe(true);
		expect(startsWithRequiredLetter(' boston', 'B')).toBe(true);
	});

	it('rejects empty answers and wrong letters', () => {
		expect(startsWithRequiredLetter('', 'A')).toBe(false);
		expect(startsWithRequiredLetter('   ', 'A')).toBe(false);
		expect(startsWithRequiredLetter('Apple', 'B')).toBe(false);
	});
});
