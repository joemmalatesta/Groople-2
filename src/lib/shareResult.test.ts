import { describe, expect, it } from 'vitest';
import { shareText } from './shareResult';

describe('shareText', () => {
	it('includes the score, the letter, the dots, and groople.xyz', () => {
		const text = shareText({
			dateLabel: 'Sep 25',
			letter: 's',
			correct: [true, true, true, false, true, true, true, true, false, true, true, false]
		});

		expect(text).toContain('9/12');
		expect(text).toContain('Letter S');
		expect(text).toContain('●●●○●●●●○●●○');
		expect(text.endsWith('https://groople.xyz')).toBe(true);
	});
});
