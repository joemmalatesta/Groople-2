import { and, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, dailyPuzzleSlots, dailyPuzzles } from '$lib/server/db/schema';
import { LETTERS } from '$lib/constants';

const STALE_LOCK_MS = 10_000;
const BACKOFFS_MS = [500, 1000, 2000];

export type PuzzleSlot = {
	position: number;
	categoryId: string;
	category: string;
};

export type DailyPuzzle = {
	date: string;
	letter: string;
	slots: PuzzleSlot[];
};

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function pickLetter(): string {
	const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
	if (!letter) {
		throw new Error('No letters configured');
	}
	return letter;
}

async function getReadyPuzzle(date: string): Promise<DailyPuzzle | null> {
	const puzzleRows = await db
		.select()
		.from(dailyPuzzles)
		.where(and(eq(dailyPuzzles.date, date), eq(dailyPuzzles.status, 'ready')))
		.limit(1);

	const puzzle = puzzleRows[0];
	if (!puzzle) {
		return null;
	}

	const slots = await db
		.select({
			position: dailyPuzzleSlots.position,
			categoryId: dailyPuzzleSlots.categoryId,
			category: categories.name
		})
		.from(dailyPuzzleSlots)
		.innerJoin(categories, eq(dailyPuzzleSlots.categoryId, categories.id))
		.where(eq(dailyPuzzleSlots.date, date))
		.orderBy(dailyPuzzleSlots.position);

	if (slots.length !== 12) {
		return null;
	}

	return {
		date,
		letter: puzzle.letter,
		slots
	};
}

async function reclaimStaleLock(date: string): Promise<void> {
	const rows = await db.select().from(dailyPuzzles).where(eq(dailyPuzzles.date, date)).limit(1);
	const row = rows[0];
	if (!row || row.status !== 'creating') {
		return;
	}

	if (Date.now() - row.createdAt.getTime() < STALE_LOCK_MS) {
		return;
	}

	await db.delete(dailyPuzzleSlots).where(eq(dailyPuzzleSlots.date, date));
	await db.delete(dailyPuzzles).where(eq(dailyPuzzles.date, date));
}

async function tryClaimPuzzle(date: string): Promise<boolean> {
	try {
		await db.insert(dailyPuzzles).values({
			date,
			letter: pickLetter(),
			status: 'creating'
		});
		return true;
	} catch (error) {
		if (isUniqueViolation(error)) {
			return false;
		}
		throw error;
	}
}

async function fillSlots(date: string): Promise<void> {
	const pool = await db
		.select({
			id: categories.id
		})
		.from(categories)
		.where(eq(categories.archived, false))
		.orderBy(sql`RANDOM()`)
		.limit(12);

	if (pool.length < 12) {
		throw new Error('Need at least 12 non-archived categories to build a puzzle');
	}

	await db.insert(dailyPuzzleSlots).values(
		pool.map((category, index) => ({
			date,
			position: index + 1,
			categoryId: category.id
		}))
	);
}

async function waitForReady(date: string): Promise<DailyPuzzle> {
	for (const delay of BACKOFFS_MS) {
		await sleep(delay);
		const ready = await getReadyPuzzle(date);
		if (ready) {
			return ready;
		}
	}

	throw new Error(`Timed out waiting for today's puzzle (${date})`);
}

export async function loadOrCreatePuzzle(date: string): Promise<DailyPuzzle> {
	const existing = await getReadyPuzzle(date);
	if (existing) {
		return existing;
	}

	await reclaimStaleLock(date);

	const claimed = await tryClaimPuzzle(date);
	if (!claimed) {
		return waitForReady(date);
	}

	try {
		await fillSlots(date);
		await db.update(dailyPuzzles).set({ status: 'ready' }).where(eq(dailyPuzzles.date, date));
		const ready = await getReadyPuzzle(date);
		if (!ready) {
			throw new Error('Puzzle was created but could not be loaded');
		}
		return ready;
	} catch (error) {
		await db.delete(dailyPuzzleSlots).where(eq(dailyPuzzleSlots.date, date));
		await db.delete(dailyPuzzles).where(eq(dailyPuzzles.date, date));
		throw error;
	}
}
