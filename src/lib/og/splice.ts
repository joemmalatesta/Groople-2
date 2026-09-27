import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { placements, type Letter } from './placements';

const baseUrl = new URL('./base.png', import.meta.url);
const lettersUrl = new URL('./letters.png', import.meta.url);

let parts: Promise<{ base: PNG; letters: PNG }> | undefined;

function loadParts(): Promise<{ base: PNG; letters: PNG }> {
	if (!parts) {
		parts = Promise.all([readFile(baseUrl), readFile(lettersUrl)]).then(([base, letters]) => ({
			base: PNG.sync.read(base),
			letters: PNG.sync.read(letters)
		}));
	}
	return parts;
}

function isLetter(value: string): value is Letter {
	return value in placements;
}

export async function spliceCard(letter: string): Promise<Buffer> {
	const place = isLetter(letter) ? placements[letter] : placements.G;
	const { base, letters } = await loadParts();
	const card = new PNG({ width: base.width, height: base.height });
	base.data.copy(card.data);

	for (let row = 0; row < place.sh; row++) {
		letters.data.copy(
			card.data,
			((place.dy + row) * card.width + place.dx) * 4,
			((place.sy + row) * letters.width + place.sx) * 4,
			((place.sy + row) * letters.width + place.sx + place.sw) * 4
		);
	}

	return PNG.sync.write(card);
}
