import { db } from '$lib/server/db';
import { categories, dailyCategories, dailyLetters } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { LETTERS } from '$lib/constants';

export const load: PageServerLoad = async ({ url, request }) => {
	// Get timezone from URL search params (sent by client) or default to UTC
	const timezone = url.searchParams.get('tz') || 'UTC';
	
	// Get today's date in the user's timezone
	const now = new Date();
	const today = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now); // Returns YYYY-MM-DD format
	
	// Try to fetch existing letter for today
	let todaysLetter = await db
		.select()
		.from(dailyLetters)
		.where(eq(dailyLetters.date, today))
		.limit(1);

	// Try to fetch existing categories for today
	let todaysCategories = await db
		.select({
			category: categories.category,
			order: dailyCategories.order
		})
		.from(dailyCategories)
		.innerJoin(categories, eq(dailyCategories.categoryId, categories.id))
		.where(eq(dailyCategories.date, today))
		.orderBy(dailyCategories.order);
	
	// If none exist, create them atomically using a transaction
	if (todaysLetter.length === 0 || todaysCategories.length === 0) {
		await db.transaction(async (tx) => {
			// Double-check inside transaction (prevents race condition)
			const letterCheck = await tx
				.select()
				.from(dailyLetters)
				.where(eq(dailyLetters.date, today))
				.limit(1);
			
			const categoryCheck = await tx
				.select()
				.from(dailyCategories)
				.where(eq(dailyCategories.date, today))
				.limit(1);
			
			// Create letter if it doesn't exist
			if (letterCheck.length === 0) {
				const randomLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
				await tx.insert(dailyLetters).values({
					date: today,
					letter: randomLetter
				});
			}
			
			// Create categories if they don't exist
			if (categoryCheck.length === 0) {
				// Get 12 random categories
				const allCategories = await tx
					.select()
					.from(categories)
					.orderBy(sql`RANDOM()`)
					.limit(12);
				
				// Insert them with order 1-12
				const inserts = allCategories.map((cat, idx) => ({
					date: today,
					categoryId: cat.id,
					order: idx + 1
				}));
				
				await tx.insert(dailyCategories).values(inserts);
			}
		});
		
		// Fetch the newly created data
		todaysLetter = await db
			.select()
			.from(dailyLetters)
			.where(eq(dailyLetters.date, today))
			.limit(1);
			
		todaysCategories = await db
			.select({
				category: categories.category,
				order: dailyCategories.order
			})
			.from(dailyCategories)
			.innerJoin(categories, eq(dailyCategories.categoryId, categories.id))
			.where(eq(dailyCategories.date, today))
			.orderBy(dailyCategories.order);
	}
	
	return {
		categories: todaysCategories.map(c => c.category),
		letter: todaysLetter[0]?.letter || LETTERS[Math.floor(Math.random() * LETTERS.length)]
	};
};
