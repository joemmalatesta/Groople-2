import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	answers,
	categories,
	dailyPuzzles,
	plays,
	rebuttals,
	rebuttalVotes
} from '$lib/server/db/schema';
import { addUtcDays } from '$lib/server/playerStreak';
import {
	MAX_CARDS_PER_VISIT,
	isInRebuttalBand,
	MAX_REBUTTALS_PER_PLAY,
	pickRebuttalAnswerIds,
	PROFANE_HIDE_AT,
	resolveRebuttal,
	type RebuttalCard,
	type RebuttalVoteSide
} from '$lib/rebuttalRules';

export type { RebuttalCard };

export async function countPlays(playerId: string): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(plays)
		.where(eq(plays.playerId, playerId));
	return row?.count ?? 0;
}

export async function ensurePlayerRebuttals(playerId: string, today: string): Promise<void> {
	const yesterday = addUtcDays(today, -1);
	const rows = await db
		.select({
			id: answers.id,
			yesProbability: answers.yesProbability,
			profaneProbability: answers.profaneProbability,
			puzzleDate: plays.date,
			rebuttalId: rebuttals.id
		})
		.from(answers)
		.innerJoin(plays, eq(plays.id, answers.playId))
		.leftJoin(rebuttals, eq(rebuttals.answerId, answers.id))
		.where(and(eq(plays.playerId, playerId), inArray(plays.date, [yesterday, today])));

	const byDate = new Map<string, typeof rows>();
	for (const row of rows) {
		const list = byDate.get(row.puzzleDate) ?? [];
		list.push(row);
		byDate.set(row.puzzleDate, list);
	}

	for (const [puzzleDate, playRows] of byDate) {
		const answerIds = pickRebuttalAnswerIds(
			playRows
				.filter((row) => row.rebuttalId == null)
				.map((row) => ({
					answerId: row.id,
					yesProbability: row.yesProbability,
					profaneProbability: row.profaneProbability
				}))
		);
		if (answerIds.length === 0) {
			continue;
		}
		await db
			.insert(rebuttals)
			.values(
				answerIds.map((answerId) => ({
					answerId,
					authorPlayerId: playerId,
					puzzleDate
				}))
			)
			.onConflictDoNothing({ target: rebuttals.answerId });
	}
}

export async function submitOwnRebuttal(params: {
	playerId: string;
	today: string;
	position: number;
}): Promise<{ sent: boolean; yes: number; no: number }> {
	const empty = { sent: false, yes: 0, no: 0 };
	if (params.position < 1 || params.position > 12) {
		return empty;
	}

	const [row] = await db
		.select({
			id: answers.id,
			playId: answers.playId,
			answer: answers.answer,
			correct: answers.correct,
			yesProbability: answers.yesProbability,
			profaneProbability: answers.profaneProbability
		})
		.from(answers)
		.innerJoin(plays, eq(answers.playId, plays.id))
		.where(
			and(
				eq(plays.playerId, params.playerId),
				eq(plays.date, params.today),
				eq(answers.position, params.position)
			)
		)
		.limit(1);

	if (!row || row.answer.trim().length === 0 || row.correct) {
		return empty;
	}
	if (row.profaneProbability != null && row.profaneProbability >= PROFANE_HIDE_AT) {
		return empty;
	}

	const [existing] = await db
		.select({ id: rebuttals.id })
		.from(rebuttals)
		.where(eq(rebuttals.answerId, row.id))
		.limit(1);

	if (!existing) {
		if (!isInRebuttalBand(row.yesProbability, row.profaneProbability)) {
			return empty;
		}

		const [countRow] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(rebuttals)
			.innerJoin(answers, eq(answers.id, rebuttals.answerId))
			.where(eq(answers.playId, row.playId));
		if ((countRow?.count ?? 0) >= MAX_REBUTTALS_PER_PLAY) {
			return empty;
		}

		await db
			.insert(rebuttals)
			.values({
				answerId: row.id,
				authorPlayerId: params.playerId,
				puzzleDate: params.today
			})
			.onConflictDoNothing({ target: rebuttals.answerId });
	}

	const votes = await db
		.select({ vote: rebuttalVotes.vote })
		.from(rebuttalVotes)
		.innerJoin(rebuttals, eq(rebuttals.id, rebuttalVotes.rebuttalId))
		.where(eq(rebuttals.answerId, row.id));

	let yes = 0;
	let no = 0;
	for (const vote of votes) {
		if (vote.vote === 'yes') {
			yes += 1;
		} else if (vote.vote === 'no') {
			no += 1;
		}
	}

	return { sent: true, yes, no };
}

export async function offerRebuttalCard(params: {
	playerId: string;
	today: string;
}): Promise<RebuttalCard | null> {
	if ((await countPlays(params.playerId)) < 1) {
		return null;
	}

	const yesterday = addUtcDays(params.today, -1);
	const voteCount = sql<number>`(
		select count(*)::int from ${rebuttalVotes}
		where ${rebuttalVotes.rebuttalId} = ${rebuttals.id}
	)`;

	const rows = await db
		.select({
			id: rebuttals.id,
			letter: dailyPuzzles.letter,
			category: categories.name,
			answer: answers.answer
		})
		.from(rebuttals)
		.innerJoin(answers, eq(answers.id, rebuttals.answerId))
		.innerJoin(categories, eq(categories.id, answers.categoryId))
		.innerJoin(dailyPuzzles, eq(dailyPuzzles.date, rebuttals.puzzleDate))
		.where(
			and(
				eq(rebuttals.status, 'open'),
				inArray(rebuttals.puzzleDate, [yesterday, params.today]),
				sql`not exists (
					select 1 from ${rebuttalVotes}
					where ${rebuttalVotes.rebuttalId} = ${rebuttals.id}
					and ${rebuttalVotes.playerId} = ${params.playerId}
				)`
			)
		)
		.orderBy(desc(voteCount), sql`random()`)
		.limit(1);

	const row = rows[0];
	if (!row) {
		return null;
	}

	return {
		id: row.id,
		letter: row.letter.toUpperCase(),
		category: row.category,
		answer: row.answer
	};
}

export async function castRebuttalVote(params: {
	playerId: string;
	rebuttalId: string;
	vote: RebuttalVoteSide;
	today: string;
}): Promise<void> {
	if ((await countPlays(params.playerId)) < 1) {
		return;
	}

	const yesterday = addUtcDays(params.today, -1);

	await db.transaction(async (tx) => {
		const [rebuttal] = await tx
			.select()
			.from(rebuttals)
			.where(eq(rebuttals.id, params.rebuttalId))
			.for('update');

		if (!rebuttal) {
			return;
		}
		if (rebuttal.puzzleDate !== params.today && rebuttal.puzzleDate !== yesterday) {
			return;
		}

		const inserted = await tx
			.insert(rebuttalVotes)
			.values({
				rebuttalId: params.rebuttalId,
				playerId: params.playerId,
				vote: params.vote
			})
			.onConflictDoNothing()
			.returning({ rebuttalId: rebuttalVotes.rebuttalId });

		if (inserted.length === 0 || rebuttal.status !== 'open') {
			return;
		}

		const voteRows = await tx
			.select({ vote: rebuttalVotes.vote })
			.from(rebuttalVotes)
			.where(eq(rebuttalVotes.rebuttalId, params.rebuttalId));

		const next = resolveRebuttal(
			'open',
			voteRows.map((row) => row.vote)
		);
		if (next === 'open') {
			return;
		}

		const closed = await tx
			.update(rebuttals)
			.set({ status: next, resolvedAt: new Date() })
			.where(and(eq(rebuttals.id, params.rebuttalId), eq(rebuttals.status, 'open')))
			.returning({ id: rebuttals.id });

		if (closed.length === 0 || next !== 'yes') {
			return;
		}

		const [answer] = await tx
			.update(answers)
			.set({ correct: true, rebuttaled: true })
			.where(eq(answers.id, rebuttal.answerId))
			.returning({ playId: answers.playId });

		if (!answer) {
			return;
		}

		await tx
			.update(plays)
			.set({ score: sql`${plays.score} + 1` })
			.where(eq(plays.id, answer.playId));
	});
}

export function rebuttalVisitIsFull(seen: number): boolean {
	return seen >= MAX_CARDS_PER_VISIT;
}
