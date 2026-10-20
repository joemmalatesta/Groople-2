import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listPlayedDates } from '$lib/server/persistPlay';
import { isPlayerId } from '$lib/playerId';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const playerId = body && typeof body === 'object' && 'playerId' in body ? body.playerId : null;

	if (!isPlayerId(playerId)) {
		error(400, 'Invalid player');
	}

	return json({ dates: await listPlayedDates(playerId) });
};
