import { and, asc, desc, eq, inArray, lt, ne, notInArray, or, sql } from 'drizzle-orm';
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
	MIN_PLAYS_TO_JUDGE,
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

export type RebuttalOffer = {
	card: RebuttalCard | null;
	remaining: number;
};

export async function offerRebuttalCard(params: {
	playerId: string;
	today: string;
	excludeIds?: string[];
	seen?: number;
}): Promise<RebuttalOffer> {
	const none: RebuttalOffer = { card: null, remaining: 0 };
	const seen = params.seen ?? 0;
	if (seen >= MAX_CARDS_PER_VISIT || (await countPlays(params.playerId)) < MIN_PLAYS_TO_JUDGE) {
		return none;
	}

	const yesterday = addUtcDays(params.today, -1);
	const excludeIds = params.excludeIds ?? [];
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
				ne(rebuttals.authorPlayerId, params.playerId),
				sql`not exists (
					select 1 from ${rebuttalVotes}
					where ${rebuttalVotes.rebuttalId} = ${rebuttals.id}
					and ${rebuttalVotes.playerId} = ${params.playerId}
				)`,
				excludeIds.length > 0 ? notInArray(rebuttals.id, excludeIds) : undefined
			)
		)
		.orderBy(desc(voteCount), sql`random()`);

	const remaining = Math.min(rows.length, MAX_CARDS_PER_VISIT - seen);
	const row = rows[0];
	if (!row || remaining < 1) {
		return none;
	}

	return {
		card: {
			id: row.id,
			letter: row.letter.toUpperCase(),
			category: row.category,
			answer: row.answer
		},
		remaining
	};
}

export async function castRebuttalVote(params: {
	playerId: string;
	rebuttalId: string;
	vote: RebuttalVoteSide;
	today: string;
}): Promise<void> {
	if ((await countPlays(params.playerId)) < MIN_PLAYS_TO_JUDGE) {
		return;
	}

	const yesterday = addUtcDays(params.today, -1);

	await db.transaction(async (tx) => {
		const [rebuttal] = await tx
			.select()
			.from(rebuttals)
			.where(eq(rebuttals.id, params.rebuttalId))
			.for('update');

		if (!rebuttal || rebuttal.authorPlayerId === params.playerId) {
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

const INBOX_PAGE_SIZE = 8;

export type RequestedRebuttalRow = {
	id: string;
	answer: string;
	category: string;
	yes: number;
	no: number;
	status: 'open' | 'yes' | 'no';
	createdAt: string;
	votes: Array<'yes' | 'no'>;
};

export async function listDecidedRebuttalIds(playerId: string): Promise<string[]> {
	const rows = await db
		.select({ id: rebuttals.id })
		.from(rebuttals)
		.where(and(eq(rebuttals.authorPlayerId, playerId), ne(rebuttals.status, 'open')));
	return rows.map((row) => row.id);
}

function isoTimestamp(value: Date | string): string {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function listRequestedRebuttals(
	playerId: string,
	cursor: string | null
): Promise<{ items: RequestedRebuttalRow[]; nextCursor: string | null }> {
	let before: { createdAt: Date; id: string } | undefined;
	if (cursor) {
		const [row] = await db
			.select({ createdAt: rebuttals.createdAt, id: rebuttals.id })
			.from(rebuttals)
			.where(and(eq(rebuttals.id, cursor), eq(rebuttals.authorPlayerId, playerId)))
			.limit(1);
		before = row;
	}

	const rows = await db
		.select({
			id: rebuttals.id,
			answer: answers.answer,
			category: categories.name,
			status: rebuttals.status,
			createdAt: rebuttals.createdAt
		})
		.from(rebuttals)
		.innerJoin(answers, eq(answers.id, rebuttals.answerId))
		.innerJoin(categories, eq(categories.id, answers.categoryId))
		.where(
			and(
				eq(rebuttals.authorPlayerId, playerId),
				before
					? or(
							lt(rebuttals.createdAt, before.createdAt),
							and(eq(rebuttals.createdAt, before.createdAt), lt(rebuttals.id, before.id))
						)
					: undefined
			)
		)
		.orderBy(desc(rebuttals.createdAt), desc(rebuttals.id))
		.limit(INBOX_PAGE_SIZE + 1);

	const page = rows.slice(0, INBOX_PAGE_SIZE);
	const ids = page.map((row) => row.id);
	const voteRows =
		ids.length === 0
			? []
			: await db
					.select({
						rebuttalId: rebuttalVotes.rebuttalId,
						vote: rebuttalVotes.vote
					})
					.from(rebuttalVotes)
					.where(inArray(rebuttalVotes.rebuttalId, ids))
					.orderBy(asc(rebuttalVotes.createdAt), asc(rebuttalVotes.playerId));

	const votesById = new Map<string, Array<'yes' | 'no'>>();
	for (const vote of voteRows) {
		const list = votesById.get(vote.rebuttalId) ?? [];
		list.push(vote.vote);
		votesById.set(vote.rebuttalId, list);
	}

	const items = page.map((row) => {
		const votes = votesById.get(row.id) ?? [];
		return {
			id: row.id,
			answer: row.answer,
			category: row.category,
			yes: votes.filter((vote) => vote === 'yes').length,
			no: votes.filter((vote) => vote === 'no').length,
			status: row.status,
			createdAt: isoTimestamp(row.createdAt),
			votes
		};
	});
	const last = page.at(-1);
	return {
		items,
		nextCursor: rows.length > INBOX_PAGE_SIZE && last ? last.id : null
	};
}

export function rebuttalVisitIsFull(seen: number): boolean {
	return seen >= MAX_CARDS_PER_VISIT;
}
