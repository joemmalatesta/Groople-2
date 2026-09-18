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
	primaryKey
} from 'drizzle-orm/pg-core';

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
		playerId: uuid('player_id').notNull(),
		score: integer('score').notNull(),
		timeRemainingMs: integer('time_remaining_ms').notNull(),
		submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
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
		noul: real('noul'),
		rebuttaled: boolean('rebuttaled').notNull().default(false)
	},
	(table) => ({
		playPositionUnique: unique('answers_play_position_unique').on(table.playId, table.position),
		categoryIdx: index('answers_category_id_idx').on(table.categoryId),
		categoryNoulIdx: index('answers_category_noul_idx').on(table.categoryId, table.noul)
	})
);
