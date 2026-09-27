import { readFile } from 'node:fs/promises';
import type { RequestHandler } from './$types';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { localDateInTimezone } from '$lib/server/localDate';

const cards: Record<string, URL> = {
	A: new URL('../../lib/og/cards/A.png', import.meta.url),
	B: new URL('../../lib/og/cards/B.png', import.meta.url),
	C: new URL('../../lib/og/cards/C.png', import.meta.url),
	D: new URL('../../lib/og/cards/D.png', import.meta.url),
	E: new URL('../../lib/og/cards/E.png', import.meta.url),
	F: new URL('../../lib/og/cards/F.png', import.meta.url),
	G: new URL('../../lib/og/cards/G.png', import.meta.url),
	H: new URL('../../lib/og/cards/H.png', import.meta.url),
	I: new URL('../../lib/og/cards/I.png', import.meta.url),
	J: new URL('../../lib/og/cards/J.png', import.meta.url),
	K: new URL('../../lib/og/cards/K.png', import.meta.url),
	L: new URL('../../lib/og/cards/L.png', import.meta.url),
	M: new URL('../../lib/og/cards/M.png', import.meta.url),
	N: new URL('../../lib/og/cards/N.png', import.meta.url),
	O: new URL('../../lib/og/cards/O.png', import.meta.url),
	P: new URL('../../lib/og/cards/P.png', import.meta.url),
	Q: new URL('../../lib/og/cards/Q.png', import.meta.url),
	R: new URL('../../lib/og/cards/R.png', import.meta.url),
	S: new URL('../../lib/og/cards/S.png', import.meta.url),
	T: new URL('../../lib/og/cards/T.png', import.meta.url),
	U: new URL('../../lib/og/cards/U.png', import.meta.url),
	V: new URL('../../lib/og/cards/V.png', import.meta.url),
	W: new URL('../../lib/og/cards/W.png', import.meta.url),
	X: new URL('../../lib/og/cards/X.png', import.meta.url),
	Y: new URL('../../lib/og/cards/Y.png', import.meta.url),
	Z: new URL('../../lib/og/cards/Z.png', import.meta.url)
};

export const GET: RequestHandler = async () => {
	let letter = 'G';
	try {
		const puzzle = await loadOrCreatePuzzle(localDateInTimezone('America/Los_Angeles'));
		const next = puzzle.letter.toUpperCase();
		if (next in cards) letter = next;
	} catch {
		letter = 'G';
	}

	const card = cards[letter] ?? cards.G;
	if (!card) {
		throw new Error('Missing share card');
	}
	const png = await readFile(card);

	return new Response(png, {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=300'
		}
	});
};
