import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LETTERS } from '$lib/constants';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { isValidTimeZone, localDateInTimezone } from '$lib/server/localDate';
import { getPlayForPlayerDate } from '$lib/server/persistPlay';
import { getPlayer } from '$lib/server/players';
import { getScoreboardStats } from '$lib/server/scoreboard';
import { isPlayerId } from '$lib/playerId';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const timezone = body && typeof body === 'object' && 'tz' in body ? body.tz : null;
	const playerId =
		body && typeof body === 'object' && 'playerId' in body ? body.playerId : null;

	if (typeof timezone !== 'string' || !isValidTimeZone(timezone)) {
		error(400, 'Invalid timezone');
	}

	const puzzle = await loadOrCreatePuzzle(localDateInTimezone(timezone));
	const play = isPlayerId(playerId) ? await getPlayForPlayerDate(playerId, puzzle.date) : null;
	const player = isPlayerId(playerId) ? await getPlayer(playerId) : null;
	const scoreboard =
		isPlayerId(playerId) && play
			? await getScoreboardStats(puzzle.date, playerId, play.score)
			: null;

	return json({
		date: puzzle.date,
		categories: puzzle.slots.map((slot) => slot.category),
		letter: puzzle.letter || LETTERS[0],
		play,
		player,
		scoreboard
	});
};
