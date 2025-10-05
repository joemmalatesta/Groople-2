import {
	pgTable,
	serial,
	text,
	integer,
	boolean,
	timestamp,
	timestamptz,
	index,
	uuid
} from 'drizzle-orm/pg-core';

export const categories = pgTable(
	'categories',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		category: text('category').notNull()
	},
	(table) => ({
		idIdx: index('categories_id_idx').on(table.id)
	})
);

export const plays = pgTable(
	'plays',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
		score: integer('score').notNull()
	},
	(table) => ({
		idIdx: index('plays_id_idx').on(table.id),
		timestampIdx: index('plays_timestamp_idx').on(table.timestamp)
	})
);

export const answers = pgTable(
	'answers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		playId: uuid('play_id')
			.notNull()
			.references(() => plays.id),
		categoryId: uuid('category_id')
			.notNull()
			.references(() => categories.id),
		answer: text('answer').notNull(),
		rebuttaled: boolean('rebuttaled').default(false).notNull(),
		correct: boolean('correct').notNull()
	},
	(table) => ({
		idIdx: index('answers_id_idx').on(table.id),
		playIdIdx: index('answers_play_id_idx').on(table.playId),
		categoryIdIdx: index('answers_category_id_idx').on(table.categoryId)
	})
);
