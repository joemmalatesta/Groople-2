import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { answers, plays, rebuttals, rebuttalVotes } from '$lib/server/db/schema';
import type { DailyPuzzle } from '$lib/server/loadOrCreatePuzzle';
import type { GradeResult } from '$lib/server/gradeAnswers';
import type { PlayClient } from '$lib/playClient';
import { PROFANE_HIDE_AT } from '$lib/rebuttalRules';
import type { SavedPlay } from '$lib/savedPlay';
import { recordPlayerPlay } from './players';

export type { SavedPlay };

function isUniqueViolation(error: unknown): boolean {
	let current: unknown = error;
	while (current && typeof current === 'object') {
		if ('code' in current && current.code === '23505') {
			return true;
		}
		current = 'cause' in current ? current.cause : null;
	}
	return false;
}

export async function getPlayForPlayerDate(
	playerId: string,
	date: string
): Promise<SavedPlay | null> {
	const playRows = await db
		.select()
		.from(plays)
		.where(and(eq(plays.playerId, playerId), eq(plays.date, date)))
		.limit(1);

	const play = playRows[0];
	if (!play) {
		return null;
	}

	const answerRows = await db
		.select()
		.from(answers)
		.where(eq(answers.playId, play.id))
		.orderBy(answers.position);

	const byPosition = new Map(answerRows.map((row) => [row.position, row]));

	const voteRows = await db
		.select({ position: answers.position, vote: rebuttalVotes.vote })
		.from(rebuttals)
		.innerJoin(answers, eq(rebuttals.answerId, answers.id))
		.leftJoin(rebuttalVotes, eq(rebuttalVotes.rebuttalId, rebuttals.id))
		.where(eq(answers.playId, play.id));

	const tallies = new Map<number, { yes: number; no: number }>();
	for (const row of voteRows) {
		const tally = tallies.get(row.position) ?? { yes: 0, no: 0 };
		if (row.vote === 'yes') {
			tally.yes += 1;
		} else if (row.vote === 'no') {
			tally.no += 1;
		}
		tallies.set(row.position, tally);
	}

	return {
		answers: Array.from({ length: 12 }, (_, index) => byPosition.get(index + 1)?.answer ?? ''),
		validationResults: Array.from(
			{ length: 12 },
			(_, index) => byPosition.get(index + 1)?.correct ?? false
		),
		score: play.score,
		timeRemainingMs: play.timeRemainingMs,
		rebuttalPositions: [...tallies.keys()],
		rebuttalVotes: [...tallies.entries()].map(([position, tally]) => ({
			position,
			yes: tally.yes,
			no: tally.no
		})),
		yesProbabilities: Array.from(
			{ length: 12 },
			(_, index) => byPosition.get(index + 1)?.yesProbability ?? null
		),
		profane: Array.from({ length: 12 }, (_, index) => {
			const probability = byPosition.get(index + 1)?.profaneProbability;
			return probability != null && probability >= PROFANE_HIDE_AT;
		})
	};
}

export async function recordPlayShare(playerId: string, date: string): Promise<void> {
	await db
		.update(plays)
		.set({ shared: true })
		.where(and(eq(plays.playerId, playerId), eq(plays.date, date)));
}

export async function persistPlay(params: {
	puzzle: DailyPuzzle;
	playerId: string;
	timezone: string;
	answers: string[];
	grade: GradeResult;
	timeRemainingMs: number;
	client?: PlayClient | null;
}): Promise<SavedPlay> {
	const score = params.grade.correct.filter(Boolean).length;

	await recordPlayerPlay({
		playerId: params.playerId,
		puzzleDate: params.puzzle.date,
		timezone: params.timezone,
		scored: score > 0
	});

	try {
		await db.transaction(async (tx) => {
			const inserted = await tx
				.insert(plays)
				.values({
					date: params.puzzle.date,
					playerId: params.playerId,
					score,
					timeRemainingMs: params.timeRemainingMs,
					client: params.client ?? null
				})
				.returning({ id: plays.id });

			const playId = inserted[0]?.id;
			if (!playId) {
				throw new Error('Failed to save play');
			}

			await tx.insert(answers).values(
				params.puzzle.slots.map((slot, index) => ({
					playId,
					position: slot.position,
					categoryId: slot.categoryId,
					answer: (params.answers[index] ?? '').trim(),
					correct: params.grade.correct[index] ?? false,
					yesProbability: params.grade.yesProbabilities[index] ?? null,
					profaneProbability: params.grade.profaneProbabilities[index] ?? null,
					rebuttaled: false
				}))
			);
		});
	} catch (error) {
		if (!isUniqueViolation(error)) {
			throw error;
		}

		const existing = await getPlayForPlayerDate(params.playerId, params.puzzle.date);
		if (!existing) {
			throw error;
		}
		return existing;
	}

	const saved = await getPlayForPlayerDate(params.playerId, params.puzzle.date);
	if (!saved) {
		throw new Error('Failed to save play');
	}
	return saved;
}
