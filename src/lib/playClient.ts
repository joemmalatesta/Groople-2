export type PlayDevice = 'mobile' | 'tablet' | 'desktop';
export type PlayColorScheme = 'light' | 'dark';

export type PlayClient = {
	device: PlayDevice;
	viewport: { width: number; height: number };
	browser: string;
	timezone: string;
	language: string;
	colorScheme: PlayColorScheme;
};

const BROWSER_MAX = 40;
const LANGUAGE_MAX = 16;

function clampViewport(value: unknown): number | null {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return null;
	}
	const rounded = Math.round(value);
	if (rounded < 1 || rounded > 10_000) {
		return null;
	}
	return rounded;
}

function deviceFromWidth(width: number): PlayDevice {
	if (width < 768) {
		return 'mobile';
	}
	if (width < 1024) {
		return 'tablet';
	}
	return 'desktop';
}

export function parseBrowser(userAgent: string): string {
	const ua = userAgent.slice(0, 512);

	const edge = ua.match(/Edg(?:e|A|iOS)?\/(\d+)/);
	if (edge?.[1]) {
		return `Edge ${edge[1]}`;
	}

	const opera = ua.match(/OPR\/(\d+)/);
	if (opera?.[1]) {
		return `Opera ${opera[1]}`;
	}

	const firefox = ua.match(/Firefox\/(\d+)/) ?? ua.match(/FxiOS\/(\d+)/);
	if (firefox?.[1]) {
		return `Firefox ${firefox[1]}`;
	}

	const chrome = ua.match(/CriOS\/(\d+)/) ?? ua.match(/Chrome\/(\d+)/);
	if (chrome?.[1] && !ua.includes('Edg')) {
		return `Chrome ${chrome[1]}`;
	}

	const safari = ua.match(/Version\/(\d+).+Safari/) ?? ua.match(/Version\/(\d+)/);
	if (safari?.[1] && /Safari/.test(ua)) {
		return `Safari ${safari[1]}`;
	}

	return 'Other';
}

export function collectPlayClient(colorScheme: PlayColorScheme): PlayClient {
	const width = clampViewport(window.innerWidth) ?? 1;
	const height = clampViewport(window.innerHeight) ?? 1;
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	const language = (navigator.language || 'und').slice(0, LANGUAGE_MAX);

	return {
		device: deviceFromWidth(width),
		viewport: { width, height },
		browser: parseBrowser(navigator.userAgent).slice(0, BROWSER_MAX),
		timezone,
		language,
		colorScheme: colorScheme === 'dark' ? 'dark' : 'light'
	};
}

function readRecord(value: unknown): Record<string, unknown> | null {
	if (typeof value === 'string') {
		try {
			const parsed: unknown = JSON.parse(value);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>;
			}
		} catch {
			return null;
		}
		return null;
	}

	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}

	return null;
}

function readViewport(raw: unknown): { width: number; height: number } | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return null;
	}

	const viewport = raw as { width?: unknown; height?: unknown };
	const width = clampViewport(viewport.width);
	const height = clampViewport(viewport.height);
	if (width === null || height === null) {
		return null;
	}

	return { width, height };
}

function readLanguage(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null;
	}
	const language = value.trim().slice(0, LANGUAGE_MAX);
	if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(language)) {
		return null;
	}
	return language;
}

function isValidTimeZone(timeZone: string): boolean {
	try {
		Intl.DateTimeFormat('en-US', { timeZone });
		return true;
	} catch {
		return false;
	}
}

export function parsePlayClient(
	value: unknown,
	timezoneFallback?: string | null
): PlayClient | null {
	const record = readRecord(value);
	if (!record) {
		return null;
	}

	const viewport = readViewport(record.viewport);
	if (!viewport) {
		return null;
	}

	const language = readLanguage(record.language);
	if (!language) {
		return null;
	}

	const colorScheme = record.colorScheme === 'dark' ? 'dark' : record.colorScheme === 'light' ? 'light' : null;
	if (!colorScheme) {
		return null;
	}

	const timezoneCandidate =
		typeof record.timezone === 'string' && isValidTimeZone(record.timezone)
			? record.timezone
			: timezoneFallback && isValidTimeZone(timezoneFallback)
				? timezoneFallback
				: null;
	if (!timezoneCandidate) {
		return null;
	}

	const device =
		record.device === 'mobile' || record.device === 'tablet' || record.device === 'desktop'
			? record.device
			: deviceFromWidth(viewport.width);

	const browser =
		typeof record.browser === 'string' && record.browser.trim().length > 0
			? record.browser.trim().slice(0, BROWSER_MAX)
			: 'Other';

	return {
		device,
		viewport,
		browser,
		timezone: timezoneCandidate,
		language,
		colorScheme
	};
}
