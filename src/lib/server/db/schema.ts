import { pgTable, serial, text, index } from 'drizzle-orm/pg-core';

export const categories = pgTable(
	'categories',
	{
		id: serial('id').primaryKey(),
		category: text('category').notNull()
	},
	(table) => ({
		idIdx: index('categories_id_idx').on(table.id)
	})
);
