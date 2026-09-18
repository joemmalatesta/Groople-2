import {
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	index,
	uuid,
	date,
	unique,
	smallint,
	real,
	jsonb,
	primaryKey
} from 'drizzle-orm/pg-core';
import type { PlayClient } from '../../playClient';

export const categories = pgTable('categories', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	archived: boolean('archived').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const dailyPuzzles = pgTable(
	'daily_puzzles',
	{
		date: date('date').primaryKey(),
		letter: text('letter').notNull(),
		status: text('status').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
		letterIdx: index('daily_puzzles_letter_idx').on(table.letter)
	})
);

export const players = pgTable(
	'players',
	{
		id: uuid('id').primaryKey(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		timezone: text('timezone'),
		lastPlayedOn: date('last_played_on'),
		streak: integer('streak').notNull().default(0),
		maxStreak: integer('max_streak').notNull().default(0),
		name: text('name'),
		metadata: text('metadata')
	},
	(table) => ({
		lastPlayedIdx: index('players_last_played_on_idx').on(table.lastPlayedOn)
	})
);

export const dailyPuzzleSlots = pgTable(
	'daily_puzzle_slots',
	{
		date: date('date')
			.notNull()
			.references(() => dailyPuzzles.date),
		position: smallint('position').notNull(),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => categories.id)
	},
	(table) => ({
		pk: primaryKey({ columns: [table.date, table.position] }),
		uniqueCategory: unique('daily_puzzle_slots_date_category_unique').on(table.date, table.categoryId)
	})
);

export const plays = pgTable(
	'plays',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		date: date('date')
			.notNull()
			.references(() => dailyPuzzles.date),
		playerId: uuid('player_id')
			.notNull()
			.references(() => players.id),
		score: integer('score').notNull(),
		timeRemainingMs: integer('time_remaining_ms').notNull(),
		submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
		client: jsonb('client').$type<PlayClient | null>()
	},
	(table) => ({
		playerDateUnique: unique('plays_player_date_unique').on(table.playerId, table.date),
		playerSubmittedIdx: index('plays_player_submitted_idx').on(table.playerId, table.submittedAt),
		dateIdx: index('plays_date_idx').on(table.date)
	})
);

export const answers = pgTable(
	'answers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		playId: uuid('play_id')
			.notNull()
			.references(() => plays.id),
		position: smallint('position').notNull(),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => categories.id),
		answer: text('answer').notNull(),
		correct: boolean('correct').notNull(),
		yesProbability: real('yes_probability'),
		rebuttaled: boolean('rebuttaled').notNull().default(false)
	},
	(table) => ({
		playPositionUnique: unique('answers_play_position_unique').on(table.playId, table.position),
		categoryIdx: index('answers_category_id_idx').on(table.categoryId),
		categoryYesProbabilityIdx: index('answers_category_yes_probability_idx').on(
			table.categoryId,
			table.yesProbability
		)
	})
);
