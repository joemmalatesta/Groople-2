import { describe, expect, it } from 'vitest';
import { sampleResult, scoreOf, shareText } from './shareCopy';

describe('shareText', () => {
	it('counts the sample as 9 of 12', () => {
		expect(scoreOf(sampleResult)).toBe(9);
	});

	it('keeps the link on its own line in every option', () => {
		for (const id of ['dots', 'letter', 'sentence', 'line', 'receipt'] as const) {
			expect(shareText(id, sampleResult)).toContain('https://groople.com');
		}
	});

	it('puts the score and the letter in the dot grid', () => {
		const text = shareText('dots', sampleResult);
		expect(text).toContain('9/12');
		expect(text).toContain('Letter S');
		expect(text).toContain('●●●○●●●●○●●○');
	});
});
