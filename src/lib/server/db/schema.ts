import { sql } from 'drizzle-orm';
import {
	pgEnum,
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	index,
	uniqueIndex,
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
		email: text('email'),
		metadata: text('metadata')
	},
	(table) => ({
		lastPlayedIdx: index('players_last_played_on_idx').on(table.lastPlayedOn)
	})
);

export const feedback = pgTable(
	'feedback',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		playerId: uuid('player_id')
			.notNull()
			.references(() => players.id),
		email: text('email'),
		body: text('body').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
		playerIdx: index('feedback_player_id_idx').on(table.playerId)
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
		uniqueCategory: unique('daily_puzzle_slots_date_category_unique').on(
			table.date,
			table.categoryId
		)
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
		shared: boolean('shared').notNull().default(false),
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
		profaneProbability: real('profane_probability'),
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

export const rebuttalStatus = pgEnum('rebuttal_status', ['open', 'yes', 'no']);
export const rebuttalVote = pgEnum('rebuttal_vote', ['yes', 'no', 'pending', 'skipped']);

export const rebuttals = pgTable(
	'rebuttals',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		answerId: uuid('answer_id')
			.notNull()
			.unique()
			.references(() => answers.id),
		authorPlayerId: uuid('author_player_id')
			.notNull()
			.references(() => players.id),
		puzzleDate: date('puzzle_date')
			.notNull()
			.references(() => dailyPuzzles.date),
		status: rebuttalStatus('status').notNull().default('open'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		resolvedAt: timestamp('resolved_at', { withTimezone: true })
	},
	(table) => ({
		statusDateIdx: index('rebuttals_status_puzzle_date_idx').on(table.status, table.puzzleDate),
		authorIdx: index('rebuttals_author_player_id_idx').on(table.authorPlayerId)
	})
);

export const rebuttalVotes = pgTable(
	'rebuttal_votes',
	{
		rebuttalId: uuid('rebuttal_id')
			.notNull()
			.references(() => rebuttals.id),
		playerId: uuid('player_id')
			.notNull()
			.references(() => players.id),
		vote: rebuttalVote('vote').notNull(),
		day: date('day').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.rebuttalId, table.playerId] }),
		onePendingPerDay: uniqueIndex('rebuttal_votes_one_pending_per_day')
			.on(table.playerId, table.day)
			.where(sql`${table.vote} = 'pending'`)
	})
);
