import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { plays } from '$lib/server/db/schema';
import {
	histogramFromCounts,
	histogramTotal,
	percentileRank,
	type ScoreboardStats,
	type ScoreHistogram
} from '$lib/scoreboard';

async function loadHistogram(
	condition: ReturnType<typeof eq>
): Promise<ScoreHistogram> {
	const rows = await db
		.select({
			score: plays.score,
			count: sql<number>`cast(count(*) as int)`
		})
		.from(plays)
		.where(condition)
		.groupBy(plays.score);

	return histogramFromCounts(
		rows.map((row) => ({
			score: row.score,
			count: Number(row.count)
		}))
	);
}

export async function getScoreboardStats(
	date: string,
	playerId: string,
	score: number
): Promise<ScoreboardStats> {
	const [personal, world] = await Promise.all([
		loadHistogram(eq(plays.playerId, playerId)),
		loadHistogram(eq(plays.date, date))
	]);

	return {
		personal,
		world,
		worldCount: histogramTotal(world),
		percentile: percentileRank(world, score)
	};
}
