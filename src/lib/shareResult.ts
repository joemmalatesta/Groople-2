export const SHARE_URL = 'https://groople.xyz';

export function shareText(result: {
	dateLabel: string;
	letter: string;
	correct: boolean[];
}): string {
	const total = result.correct.length || 12;
	const score = result.correct.filter(Boolean).length;
	const marks = result.correct.map((hit) => (hit ? '●' : '○')).join('');

	return [
		`Groople · ${result.dateLabel}`,
		`${score}/${total} · Letter ${result.letter.toUpperCase()}`,
		'',
		marks,
		'',
		SHARE_URL
	].join('\n');
}
