import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { localDateInTimezone } from '$lib/server/localDate';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

export const GET: RequestHandler = async () => {
	let letter = '';
	try {
		const puzzle = await loadOrCreatePuzzle(localDateInTimezone('America/Los_Angeles'));
		letter = puzzle.letter.toUpperCase();
	} catch {
		error(500, 'Could not draw card');
	}

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f2f2f2"/>
  <text x="72" y="470" fill="#1a1a1a" font-family="Georgia, 'Times New Roman', serif" font-size="92">Groople</text>
  <text x="72" y="548" fill="#6b7280" font-family="Inter, Helvetica, Arial, sans-serif" font-size="28">12 categories. 100 seconds. One letter.</text>
  <text x="1128" y="560" fill="#1a1a1a" font-family="Georgia, 'Times New Roman', serif" font-size="220" text-anchor="end">${escapeXml(letter)}</text>
</svg>`;

	return new Response(svg, {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
};
