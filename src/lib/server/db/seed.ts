import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { categories } from './schema';
import { CATEGORY_NAMES } from './categoryNames';
import { getDatabaseUrl, isDirectRun } from './env';

export async function seedCategories() {
	const DATABASE_URL = getDatabaseUrl();

	const client = postgres(DATABASE_URL);
	const db = drizzle(client, { schema: { categories } });

	try {
		console.log('Seeding categories...');
		await db
			.insert(categories)
			.values(CATEGORY_NAMES.map((name) => ({ name, archived: false })))
			.onConflictDoNothing({ target: categories.name });
		console.log(`Ensured ${CATEGORY_NAMES.length} categories exist`);
	} finally {
		await client.end();
	}
}

if (isDirectRun(import.meta.url)) {
	seedCategories()
		.then(() => {
			console.log('Seeding completed');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Seeding failed:', error);
			process.exit(1);
		});
}
