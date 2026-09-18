import { eq, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { plays } from '$lib/server/db/schema';
import {
	histogramFromCounts,
	histogramTotal,
	includeScore,
	percentileRank,
	type ScoreboardStats,
	type ScoreHistogram
} from '$lib/scoreboard';

function asDay(date: string): string {
	return date.slice(0, 10);
}

async function loadHistogram(condition: SQL): Promise<ScoreHistogram> {
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
			score: Number(row.score),
			count: Number(row.count)
		}))
	);
}

export async function getScoreboardStats(
	date: string,
	playerId: string,
	score: number
): Promise<ScoreboardStats> {
	const day = asDay(date);
	const [personal, worldRows] = await Promise.all([
		loadHistogram(eq(plays.playerId, playerId)),
		loadHistogram(sql`${plays.date}::text = ${day}`)
	]);
	const world = includeScore(worldRows, score);

	return {
		personal: includeScore(personal, score),
		world,
		worldCount: histogramTotal(world),
		percentile: percentileRank(world, score)
	};
}
