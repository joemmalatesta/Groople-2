import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isPlayerId } from '$lib/playerId';
import { listRequestedRebuttals } from '$lib/server/rebuttals';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const playerId = body && typeof body === 'object' && 'playerId' in body ? body.playerId : null;
	const cursor = body && typeof body === 'object' && 'cursor' in body ? body.cursor : null;

	if (!isPlayerId(playerId)) {
		error(400, 'Invalid player');
	}
	if (cursor != null && cursor !== '' && !isPlayerId(cursor)) {
		error(400, 'Invalid cursor');
	}

	const page = await listRequestedRebuttals(
		playerId,
		typeof cursor === 'string' && cursor !== '' ? cursor : null
	);
	return json(page);
};
