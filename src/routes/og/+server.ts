import type { RequestHandler } from './$types';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { localDateInTimezone } from '$lib/server/localDate';
import { spliceCard } from '$lib/og/splice';

export const GET: RequestHandler = async () => {
	let letter = 'G';
	try {
		const puzzle = await loadOrCreatePuzzle(localDateInTimezone('America/Los_Angeles'));
		letter = puzzle.letter.toUpperCase() || 'G';
	} catch {
		letter = 'G';
	}

	const png = await spliceCard(letter);

	return new Response(png, {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=300'
		}
	});
};
