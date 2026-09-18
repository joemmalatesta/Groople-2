const NAME_KEY = 'playerName';

export function readPlayerName(): string {
	if (typeof localStorage === 'undefined') {
		return '';
	}

	return localStorage.getItem(NAME_KEY)?.trim() ?? '';
}

export function writePlayerName(name: string): string {
	const trimmed = name.trim().slice(0, 80);
	if (trimmed.length === 0) {
		localStorage.removeItem(NAME_KEY);
		return '';
	}

	localStorage.setItem(NAME_KEY, trimmed);
	return trimmed;
}

export function nameInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	const first = parts[0];
	if (!first) {
		return '';
	}

	const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
	if (!last || last === first) {
		return first.slice(0, 1).toUpperCase();
	}

	return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase();
}
