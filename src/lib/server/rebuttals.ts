import { and, asc, desc, eq, inArray, lt, ne, or, sql } from 'drizzle-orm';
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
	canJudgeRebuttals,
	decidingVotes,
	isInRebuttalBand,
	MAX_REBUTTAL_CARDS_PER_DAY,
	MAX_REBUTTALS_PER_PLAY,
	pickRebuttalAnswerIds,
	pickRebuttalDraw,
	PROFANE_HIDE_AT,
	rebuttalDrawEntries,
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
	position: number;
	total: number;
};

const noRebuttal: RebuttalOffer = { card: null, position: 0, total: 0 };

type JudgeTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toCard(row: {
	id: string;
	letter: string;
	category: string;
	answer: string;
}): RebuttalCard {
	return {
		id: row.id,
		letter: row.letter.toUpperCase(),
		category: row.category,
		answer: row.answer
	};
}

function eligibleCards(playerId: string, today: string) {
	const yesterday = addUtcDays(today, -1);
	return and(
		eq(rebuttals.status, 'open'),
		inArray(rebuttals.puzzleDate, [yesterday, today]),
		ne(rebuttals.authorPlayerId, playerId),
		sql`not exists (
			select 1 from ${rebuttalVotes}
			where ${rebuttalVotes.rebuttalId} = ${rebuttals.id}
			and ${rebuttalVotes.playerId} = ${playerId}
		)`
	);
}

async function rowsToday(tx: JudgeTx, playerId: string, today: string): Promise<number> {
	const [row] = await tx
		.select({ count: sql<number>`count(*)::int` })
		.from(rebuttalVotes)
		.where(and(eq(rebuttalVotes.playerId, playerId), eq(rebuttalVotes.day, today)));
	return row?.count ?? 0;
}

async function pendingCard(
	tx: JudgeTx,
	playerId: string,
	today: string
): Promise<RebuttalCard | null> {
	const [row] = await tx
		.select({
			id: rebuttals.id,
			letter: dailyPuzzles.letter,
			category: categories.name,
			answer: answers.answer
		})
		.from(rebuttalVotes)
		.innerJoin(rebuttals, eq(rebuttals.id, rebuttalVotes.rebuttalId))
		.innerJoin(answers, eq(answers.id, rebuttals.answerId))
		.innerJoin(categories, eq(categories.id, answers.categoryId))
		.innerJoin(dailyPuzzles, eq(dailyPuzzles.date, rebuttals.puzzleDate))
		.where(
			and(
				eq(rebuttalVotes.playerId, playerId),
				eq(rebuttalVotes.day, today),
				eq(rebuttalVotes.vote, 'pending')
			)
		)
		.limit(1);
	return row ? toCard(row) : null;
}

async function openDrawCards(tx: JudgeTx, playerId: string, today: string) {
	const yesterday = addUtcDays(today, -1);
	const rows = await tx
		.select({
			id: rebuttals.id,
			letter: dailyPuzzles.letter,
			category: categories.name,
			answer: answers.answer,
			puzzleDate: rebuttals.puzzleDate,
			yeses: sql<number>`(
				select count(*)::int from rebuttal_votes
				where rebuttal_id = ${rebuttals.id}
				and vote = 'yes'
			)`.mapWith(Number),
			authorWaiting: sql<number>`(
				case when coalesce((
					select max(finished.resolved_at)
					from rebuttals finished
					where finished.author_player_id = ${rebuttals.authorPlayerId}
					and finished.status in ('yes', 'no')
				) < ${yesterday}::date, true) then 1 else 0 end
			)`.mapWith(Number)
		})
		.from(rebuttals)
		.innerJoin(answers, eq(answers.id, rebuttals.answerId))
		.innerJoin(categories, eq(categories.id, answers.categoryId))
		.innerJoin(dailyPuzzles, eq(dailyPuzzles.date, rebuttals.puzzleDate))
		.where(eligibleCards(playerId, today));

	return rows.map((row) => ({
		...toCard(row),
		fromToday: row.puzzleDate === today,
		yeses: row.yeses,
		authorWaiting: row.authorWaiting === 1
	}));
}

async function countOpenCards(tx: JudgeTx, playerId: string, today: string): Promise<number> {
	const [row] = await tx
		.select({ count: sql<number>`count(*)::int` })
		.from(rebuttals)
		.where(eligibleCards(playerId, today));
	return row?.count ?? 0;
}

function offerFrom(used: number, card: RebuttalCard, remaining: number): RebuttalOffer {
	const room = Math.max(0, MAX_REBUTTAL_CARDS_PER_DAY - used);
	return { card, position: used, total: used + Math.min(room, remaining) };
}

async function currentOffer(tx: JudgeTx, playerId: string, today: string): Promise<RebuttalOffer> {
	const held = await pendingCard(tx, playerId, today);
	const used = await rowsToday(tx, playerId, today);
	if (held) {
		const room = Math.max(0, MAX_REBUTTAL_CARDS_PER_DAY - used);
		const remaining = room === 0 ? 0 : await countOpenCards(tx, playerId, today);
		return offerFrom(used, held, remaining);
	}
	if (used >= MAX_REBUTTAL_CARDS_PER_DAY) {
		return noRebuttal;
	}

	const candidates = await openDrawCards(tx, playerId, today);
	const picked = pickRebuttalDraw(rebuttalDrawEntries(candidates));
	if (!picked) {
		return noRebuttal;
	}

	await tx
		.insert(rebuttalVotes)
		.values({
			rebuttalId: picked.id,
			playerId,
			vote: 'pending',
			day: today
		})
		.onConflictDoNothing();

	const card = await pendingCard(tx, playerId, today);
	if (!card) {
		return noRebuttal;
	}
	const position = used + 1;
	const more = candidates.filter((candidate) => candidate.id !== card.id).length;
	return offerFrom(position, card, more);
}

async function withTodayPlay(
	playerId: string,
	today: string,
	run: (tx: JudgeTx) => Promise<RebuttalOffer>
): Promise<RebuttalOffer> {
	return db.transaction(async (tx) => {
		const [play] = await tx
			.select({ id: plays.id })
			.from(plays)
			.where(and(eq(plays.playerId, playerId), eq(plays.date, today)))
			.limit(1)
			.for('update');
		if (!play) {
			return noRebuttal;
		}

		const [countRow] = await tx
			.select({ count: sql<number>`count(*)::int` })
			.from(plays)
			.where(eq(plays.playerId, playerId));
		if (!canJudgeRebuttals(countRow?.count ?? 0, true)) {
			return noRebuttal;
		}

		return run(tx);
	});
}

export async function offerRebuttalCard(params: {
	playerId: string;
	today: string;
}): Promise<RebuttalOffer> {
	return withTodayPlay(params.playerId, params.today, (tx) =>
		currentOffer(tx, params.playerId, params.today)
	);
}

async function applyVote(
	tx: JudgeTx,
	params: { playerId: string; rebuttalId: string; vote: RebuttalVoteSide; today: string }
): Promise<void> {
	const yesterday = addUtcDays(params.today, -1);
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
	if (rebuttal.status !== 'open') {
		return;
	}

	const voteRows = await tx
		.select({ vote: rebuttalVotes.vote })
		.from(rebuttalVotes)
		.where(eq(rebuttalVotes.rebuttalId, params.rebuttalId));

	const next = resolveRebuttal('open', decidingVotes(voteRows.map((row) => row.vote)));
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
}

async function settlePending(
	tx: JudgeTx,
	params: { playerId: string; rebuttalId: string; today: string; vote: 'yes' | 'no' | 'skipped' }
): Promise<boolean> {
	const updated = await tx
		.update(rebuttalVotes)
		.set({ vote: params.vote })
		.where(
			and(
				eq(rebuttalVotes.rebuttalId, params.rebuttalId),
				eq(rebuttalVotes.playerId, params.playerId),
				eq(rebuttalVotes.day, params.today),
				eq(rebuttalVotes.vote, 'pending')
			)
		)
		.returning({ rebuttalId: rebuttalVotes.rebuttalId });
	return updated.length > 0;
}

export async function castRebuttalVote(params: {
	playerId: string;
	rebuttalId: string;
	vote: RebuttalVoteSide;
	today: string;
}): Promise<RebuttalOffer> {
	return withTodayPlay(params.playerId, params.today, async (tx) => {
		if (await settlePending(tx, params)) {
			await applyVote(tx, params);
		}
		return currentOffer(tx, params.playerId, params.today);
	});
}

export async function skipRebuttalCard(params: {
	playerId: string;
	rebuttalId: string;
	today: string;
}): Promise<RebuttalOffer> {
	return withTodayPlay(params.playerId, params.today, async (tx) => {
		await settlePending(tx, { ...params, vote: 'skipped' });
		return currentOffer(tx, params.playerId, params.today);
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
		if (vote.vote !== 'yes' && vote.vote !== 'no') {
			continue;
		}
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
