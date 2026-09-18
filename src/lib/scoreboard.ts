export type ScoreHistogram = number[];

export function emptyHistogram(): ScoreHistogram {
	return Array.from({ length: 13 }, () => 0);
}

export function histogramTotal(histogram: ScoreHistogram): number {
	return histogram.reduce((sum, count) => sum + count, 0);
}

export function percentileRank(histogram: ScoreHistogram, score: number): number {
	const total = histogramTotal(histogram);
	if (total === 0) {
		return 0;
	}

	const clamped = Math.min(12, Math.max(0, score));
	const below = histogram.slice(0, clamped).reduce((sum, count) => sum + count, 0);
	return Math.round((below / total) * 100);
}

export function percentileLabel(percentile: number): string {
	const lastTwo = percentile % 100;
	if (lastTwo >= 11 && lastTwo <= 13) {
		return `${percentile}th`;
	}

	switch (percentile % 10) {
		case 1:
			return `${percentile}st`;
		case 2:
			return `${percentile}nd`;
		case 3:
			return `${percentile}rd`;
		default:
			return `${percentile}th`;
	}
}

export type ScoreboardStats = {
	personal: ScoreHistogram;
	world: ScoreHistogram;
	worldCount: number;
	percentile: number;
};

export function histogramFromCounts(
	rows: Array<{ score: number; count: number }>
): ScoreHistogram {
	const histogram = emptyHistogram();
	for (const row of rows) {
		const score = Number(row.score);
		const count = Number(row.count);
		if (Number.isInteger(score) && score >= 0 && score <= 12 && count > 0) {
			histogram[score] = (histogram[score] ?? 0) + count;
		}
	}
	return histogram;
}

export function includeScore(histogram: ScoreHistogram, score: number): ScoreHistogram {
	const next = histogram.length === 13 ? [...histogram] : emptyHistogram();
	const index = Math.min(12, Math.max(0, Math.round(score)));
	if ((next[index] ?? 0) <= 0) {
		next[index] = 1;
	}
	return next;
}
