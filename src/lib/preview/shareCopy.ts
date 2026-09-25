export type ShareResult = {
	dateLabel: string;
	letter: string;
	correct: boolean[];
	streak: number;
	url: string;
};

export const sampleResult: ShareResult = {
	dateLabel: 'Sep 25',
	letter: 'S',
	correct: [true, true, true, false, true, true, true, true, false, true, true, false],
	streak: 4,
	url: 'https://groople.xyz'
};

export function scoreOf(result: ShareResult): number {
	return result.correct.filter(Boolean).length;
}

export function missedOf(result: ShareResult): number {
	return result.correct.length - scoreOf(result);
}

function marks(result: ShareResult, on: string, off: string): string {
	return result.correct.map((hit) => (hit ? on : off)).join('');
}

export type ShareOptionId = 'dots' | 'letter' | 'sentence' | 'line' | 'receipt';

export function shareText(id: ShareOptionId, result: ShareResult): string {
	const score = scoreOf(result);
	const total = result.correct.length;
	const letter = result.letter.toUpperCase();

	switch (id) {
		case 'dots':
			return [
				`Groople · ${result.dateLabel}`,
				`${score}/${total} · Letter ${letter}`,
				'',
				marks(result, '●', '○'),
				'',
				result.url
			].join('\n');
		case 'letter':
			return [`${letter}`, `${score} of ${total} on Groople`, result.url].join('\n');
		case 'sentence':
			return `Got ${score} of ${total} on Groople. Today's letter was ${letter}.\n${result.url}`;
		case 'line':
			return `GROOPLE  ${score}/${total}  ${letter}\n${result.url}`;
		case 'receipt':
			return [
				`Groople ${result.dateLabel}`,
				`${score} right · ${missedOf(result)} missed · letter ${letter}`,
				result.url
			].join('\n');
	}
}
