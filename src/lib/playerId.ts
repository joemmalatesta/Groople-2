const PLAYER_ID_KEY = 'groople_player_id';
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPlayerId(value: unknown): value is string {
	return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function getOrCreatePlayerId(): string {
	const existing = localStorage.getItem(PLAYER_ID_KEY);
	if (isPlayerId(existing)) {
		return existing;
	}

	const playerId = crypto.randomUUID();
	localStorage.setItem(PLAYER_ID_KEY, playerId);
	return playerId;
}

export function setPlayerId(playerId: string): boolean {
	if (!isPlayerId(playerId)) {
		return false;
	}

	localStorage.setItem(PLAYER_ID_KEY, playerId);
	return true;
}

export function parsePlayerId(value: FormDataEntryValue | null): string | null {
	return isPlayerId(value) ? value : null;
}
