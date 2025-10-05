import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { categories } from './schema';

const dummyCategories = [
	'Technology',
	'Food & Dining',
	'Health & Fitness',
	'Travel & Tourism',
	'Fashion & Style',
	'Home & Garden',
	'Entertainment',
	'Sports & Recreation',
	'Education & Learning',
	'Business & Finance',
	'Art & Culture',
	'Automotive'
];

export async function seedCategories() {
	// Get DATABASE_URL from environment variable
	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	// Create database connection
	const client = postgres(DATABASE_URL);
	const db = drizzle(client, { schema: { categories } });

	try {
		console.log('Seeding categories...');

		// Insert all categories at once
		await db.insert(categories).values(dummyCategories.map((category) => ({ category })));

		console.log(`Successfully seeded ${dummyCategories.length} categories`);
	} catch (error) {
		console.error('Error seeding categories:', error);
		throw error;
	} finally {
		// Close the database connection
		await client.end();
	}
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
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
