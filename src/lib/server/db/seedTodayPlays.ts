import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { dailyPuzzles, players, plays } from './schema';
import { getDatabaseUrl, isDirectRun } from './env';
import { localDateInTimezone } from '../localDate';

const SEEDED_PLAYS = [
	{ id: 'a1111111-1111-4111-8111-111111111101', score: 0, timeRemainingMs: 0 },
	{ id: 'a1111111-1111-4111-8111-111111111102', score: 1, timeRemainingMs: 12000 },
	{ id: 'a1111111-1111-4111-8111-111111111103', score: 2, timeRemainingMs: 8000 },
	{ id: 'a1111111-1111-4111-8111-111111111104', score: 4, timeRemainingMs: 24000 },
	{ id: 'a1111111-1111-4111-8111-111111111105', score: 5, timeRemainingMs: 31000 },
	{ id: 'a1111111-1111-4111-8111-111111111106', score: 6, timeRemainingMs: 18000 },
	{ id: 'a1111111-1111-4111-8111-111111111107', score: 6, timeRemainingMs: 9000 },
	{ id: 'a1111111-1111-4111-8111-111111111108', score: 7, timeRemainingMs: 41000 },
	{ id: 'a1111111-1111-4111-8111-111111111109', score: 8, timeRemainingMs: 22000 },
	{ id: 'a1111111-1111-4111-8111-111111111110', score: 10, timeRemainingMs: 5000 }
] as const;

export async function seedTodayPlays(timeZone = 'America/Los_Angeles') {
	const date = localDateInTimezone(timeZone);
	const client = postgres(getDatabaseUrl(), { prepare: false });
	const db = drizzle(client, { schema: { dailyPuzzles, players, plays } });

	try {
		const puzzle = await db
			.select({ date: dailyPuzzles.date })
			.from(dailyPuzzles)
			.where(eq(dailyPuzzles.date, date))
			.limit(1);

		if (!puzzle[0]) {
			throw new Error(`No daily puzzle for ${date}`);
		}

		await db
			.insert(players)
			.values(
				SEEDED_PLAYS.map((play) => ({
					id: play.id,
					timezone: timeZone,
					lastPlayedOn: date,
					streak: play.score > 0 ? 1 : 0,
					maxStreak: play.score > 0 ? 1 : 0,
					name: `Seed ${play.score}`
				}))
			)
			.onConflictDoNothing({ target: players.id });

		await db
			.insert(plays)
			.values(
				SEEDED_PLAYS.map((play) => ({
					date,
					playerId: play.id,
					score: play.score,
					timeRemainingMs: play.timeRemainingMs
				}))
			)
			.onConflictDoNothing({ target: [plays.playerId, plays.date] });

		console.log(`Seeded ${SEEDED_PLAYS.length} plays for ${date}`);
	} finally {
		await client.end();
	}
}

if (isDirectRun(import.meta.url)) {
	seedTodayPlays()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}
