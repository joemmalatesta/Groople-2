import { db } from '$lib/server/db';
import { answers, plays } from '$lib/server/db/schema';
import type { DailyPuzzle } from '$lib/server/loadOrCreatePuzzle';
import type { GradeResult } from '$lib/server/gradeAnswers';

export async function persistPlay(params: {
	puzzle: DailyPuzzle;
	playerId: string;
	answers: string[];
	grade: GradeResult;
	timeRemainingMs: number;
}): Promise<void> {
	const score = params.grade.correct.filter(Boolean).length;

	const inserted = await db
		.insert(plays)
		.values({
			date: params.puzzle.date,
			playerId: params.playerId,
			score,
			timeRemainingMs: params.timeRemainingMs
		})
		.returning({ id: plays.id });

	const playId = inserted[0]?.id;
	if (!playId) {
		throw new Error('Failed to save play');
	}

	await db.insert(answers).values(
		params.puzzle.slots.map((slot, index) => ({
			playId,
			position: slot.position,
			categoryId: slot.categoryId,
			answer: (params.answers[index] ?? '').trim(),
			correct: params.grade.correct[index] ?? false,
			noul: params.grade.nouls[index] ?? null,
			rebuttaled: false
		}))
	);
}
