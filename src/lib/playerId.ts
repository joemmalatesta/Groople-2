const PLAYER_ID_KEY = 'groople_player_id';
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getOrCreatePlayerId(): string {
	const existing = localStorage.getItem(PLAYER_ID_KEY);
	if (existing && UUID_PATTERN.test(existing)) {
		return existing;
	}

	const playerId = crypto.randomUUID();
	localStorage.setItem(PLAYER_ID_KEY, playerId);
	return playerId;
}

export function parsePlayerId(value: FormDataEntryValue | null): string {
	if (typeof value === 'string' && UUID_PATTERN.test(value)) {
		return value;
	}

	return crypto.randomUUID();
}
