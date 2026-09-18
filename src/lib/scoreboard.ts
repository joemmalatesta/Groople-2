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
		if (row.score >= 0 && row.score <= 12) {
			histogram[row.score] = row.count;
		}
	}
	return histogram;
}
