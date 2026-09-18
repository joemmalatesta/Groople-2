import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { players } from '$lib/server/db/schema';
import type { PlayerProfile } from '$lib/playerProfile';
import { streakAfterPlay } from './playerStreak';

export const NAME_MAX = 80;
export const METADATA_MAX = 200;

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

export function emptyToNull(value: string | null | undefined, max: number): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}

	return trimmed.slice(0, max);
}

function toProfile(row: typeof players.$inferSelect): PlayerProfile {
	return {
		id: row.id,
		name: row.name,
		metadata: row.metadata,
		streak: row.streak,
		maxStreak: row.maxStreak,
		lastPlayedOn: row.lastPlayedOn,
		timezone: row.timezone
	};
}

export async function getPlayer(playerId: string): Promise<PlayerProfile | null> {
	const rows = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
	const row = rows[0];
	return row ? toProfile(row) : null;
}

export async function findPlayerByMetadata(metadata: string): Promise<PlayerProfile | null> {
	const normalized = emptyToNull(metadata, METADATA_MAX);
	if (!normalized) {
		return null;
	}

	const rows = await db
		.select()
		.from(players)
		.where(sql`lower(btrim(${players.metadata})) = lower(btrim(${normalized}))`)
		.limit(1);

	const row = rows[0];
	return row ? toProfile(row) : null;
}

export async function upsertPlayerProfile(params: {
	playerId: string;
	name: string | null;
	metadata?: string | null;
	timezone?: string | null;
}): Promise<PlayerProfile> {
	const name = emptyToNull(params.name, NAME_MAX);
	const metadata =
		params.metadata === undefined ? undefined : emptyToNull(params.metadata, METADATA_MAX);
	const now = new Date();
	const updateSet = {
		name,
		updatedAt: now,
		...(metadata !== undefined ? { metadata } : {}),
		...(params.timezone ? { timezone: params.timezone } : {})
	};

	try {
		const inserted = await db
			.insert(players)
			.values({
				id: params.playerId,
				name,
				metadata: metadata ?? null,
				timezone: params.timezone ?? null,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: players.id,
				set: updateSet
			})
			.returning();

		const row = inserted[0];
		if (!row) {
			throw new Error('Failed to save player');
		}
		return toProfile(row);
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new Error('That metadata is already claimed');
		}
		throw error;
	}
}

export async function recordPlayerPlay(params: {
	playerId: string;
	puzzleDate: string;
	timezone: string;
	scored: boolean;
}): Promise<PlayerProfile> {
	const existingRows = await db
		.select()
		.from(players)
		.where(eq(players.id, params.playerId))
		.limit(1);
	const existing = existingRows[0];
	const next = streakAfterPlay(
		{
			lastPlayedOn: existing?.lastPlayedOn ?? null,
			streak: existing?.streak ?? 0,
			maxStreak: existing?.maxStreak ?? 0
		},
		params.puzzleDate,
		params.scored
	);
	const now = new Date();

	if (!existing) {
		const inserted = await db
			.insert(players)
			.values({
				id: params.playerId,
				timezone: params.timezone,
				lastPlayedOn: next.lastPlayedOn,
				streak: next.streak,
				maxStreak: next.maxStreak,
				updatedAt: now
			})
			.returning();
		const row = inserted[0];
		if (!row) {
			throw new Error('Failed to save player');
		}
		return toProfile(row);
	}

	const updated = await db
		.update(players)
		.set({
			timezone: params.timezone,
			lastPlayedOn: next.lastPlayedOn,
			streak: next.streak,
			maxStreak: next.maxStreak,
			updatedAt: now
		})
		.where(eq(players.id, params.playerId))
		.returning();

	const row = updated[0];
	if (!row) {
		throw new Error('Failed to save player');
	}
	return toProfile(row);
}
