import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import type { ReactElement } from 'react';
import type { RequestHandler } from './$types';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { localDateInTimezone } from '$lib/server/localDate';
import { ogFontBase64 } from '$lib/ogFont';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm?inline';

const font = Uint8Array.from(Buffer.from(ogFontBase64, 'base64'));

let wasmReady: Promise<void> | undefined;

function ensureWasm(): Promise<void> {
	if (!wasmReady) {
		const base64 = resvgWasm.includes(',') ? resvgWasm.split(',')[1]! : resvgWasm;
		wasmReady = initWasm(Uint8Array.from(Buffer.from(base64, 'base64')));
	}
	return wasmReady;
}

function el(
	type: string,
	style: Record<string, string | number>,
	children?: unknown
): ReactElement {
	return { type, props: { style, children }, key: null } as unknown as ReactElement;
}

export const GET: RequestHandler = async () => {
	let letter = 'G';
	// Draw even if today's puzzle cannot be loaded.
	try {
		const puzzle = await loadOrCreatePuzzle(localDateInTimezone('America/Los_Angeles'));
		letter = puzzle.letter.toUpperCase() || 'G';
	} catch {
		letter = 'G';
	}

	const svg = await satori(
		el(
			'div',
			{
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'flex-end',
				justifyContent: 'space-between',
				background: '#f2f2f2',
				color: '#1a1a1a',
				padding: '72px',
				fontFamily: 'Instrument Serif'
			},
			[
				el('div', { display: 'flex', flexDirection: 'column' }, [
					el('div', { fontSize: 92 }, 'Groople'),
					el(
						'div',
						{ fontSize: 32, color: '#6b7280', marginTop: 18 },
						'12 categories. 100 seconds. One letter.'
					)
				]),
				el('div', { fontSize: 220, lineHeight: 1 }, letter)
			]
		),
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'Instrument Serif',
					data: font,
					weight: 400,
					style: 'normal'
				}
			]
		}
	);

	await ensureWasm();
	const png = new Resvg(svg).render().asPng();

	return new Response(png, {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=300'
		}
	});
};
