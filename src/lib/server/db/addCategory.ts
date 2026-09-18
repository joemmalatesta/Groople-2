import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { categories } from './schema';
import { getDatabaseUrl, isDirectRun } from './env';

function parseArgs(argv: string[]) {
	const pool = argv.includes('--pool');
	const archive = argv.includes('--archive');
	const name = argv.find((arg) => !arg.startsWith('--'));

	return { name, inPool: pool && !archive };
}

export async function addCategory(name: string, archived: boolean) {
	const DATABASE_URL = getDatabaseUrl();

	const client = postgres(DATABASE_URL);
	const db = drizzle(client, { schema: { categories } });

	try {
		const inserted = await db
			.insert(categories)
			.values({ name, archived })
			.onConflictDoNothing({ target: categories.name })
			.returning({ id: categories.id, name: categories.name, archived: categories.archived });

		if (inserted[0]) {
			console.log(
				`Added "${inserted[0].name}" (${inserted[0].archived ? 'archived, not in random pool' : 'in random pool'})`
			);
			return;
		}

		const existing = await db
			.select()
			.from(categories)
			.where(eq(categories.name, name))
			.limit(1);
		const row = existing[0];
		if (!row) {
			throw new Error(`Category "${name}" already exists but could not be loaded`);
		}

		if (row.archived !== archived) {
			await db.update(categories).set({ archived }).where(eq(categories.id, row.id));
			console.log(
				`Updated "${name}" to ${archived ? 'archived (not in random pool)' : 'in random pool'}`
			);
			return;
		}

		console.log(
			`"${name}" already exists (${row.archived ? 'archived, not in random pool' : 'in random pool'})`
		);
	} finally {
		await client.end();
	}
}

if (isDirectRun(import.meta.url)) {
	const { name, inPool } = parseArgs(process.argv.slice(2));
	if (!name) {
		console.error('Usage: pnpm db:category -- "Street Foods" [--pool] [--archive]');
		console.error('New categories default to archived so they stay out of the random pile.');
		console.error('Pass --pool to include a category in future daily puzzles.');
		process.exit(1);
	}

	addCategory(name, !inPool)
		.then(() => process.exit(0))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}
