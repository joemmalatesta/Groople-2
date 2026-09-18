import { describe, expect, it } from 'vitest';
import { parseBrowser, parsePlayClient } from './playClient';

describe('parseBrowser', () => {
	it('reads Chrome, Safari, Firefox, and Edge', () => {
		expect(
			parseBrowser(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
			)
		).toBe('Chrome 129');
		expect(
			parseBrowser(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
			)
		).toBe('Safari 18');
		expect(parseBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0')).toBe(
			'Firefox 131'
		);
		expect(
			parseBrowser(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0'
			)
		).toBe('Edge 129');
	});
});

describe('parsePlayClient', () => {
	const valid = {
		device: 'mobile',
		viewport: { width: 390, height: 844 },
		browser: 'Safari 18',
		timezone: 'America/Los_Angeles',
		language: 'en-US',
		colorScheme: 'dark'
	};

	it('accepts a complete client payload', () => {
		expect(parsePlayClient(JSON.stringify(valid))).toEqual(valid);
	});

	it('rejects invalid viewport and language', () => {
		expect(parsePlayClient({ ...valid, viewport: { width: 0, height: 844 } })).toBeNull();
		expect(parsePlayClient({ ...valid, language: 'not a locale!!' })).toBeNull();
	});

	it('fills timezone from the form when the payload timezone is bad', () => {
		expect(
			parsePlayClient({ ...valid, timezone: 'Not/AZone' }, 'America/New_York')
		).toMatchObject({ timezone: 'America/New_York' });
	});
});
