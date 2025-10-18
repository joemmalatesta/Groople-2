import { db } from '$lib/server/db';
import { categories, dailyCategories, dailyLetters } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { LETTERS, GAME_PROMPT } from '$lib/constants';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { OPENAI_API_KEY } from '$env/static/private';

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

const openai = createOpenAI({
	apiKey: OPENAI_API_KEY
});

export const actions: Actions = {
	validate: async ({ request }) => {
		try {
			console.log('Validate action called');
			const formData = await request.formData();
			const letter = formData.get('letter') as string;
			
			// Get all 12 answers from form data
			const answers: string[] = [];
			for (let i = 1; i <= 12; i++) {
				const answer = formData.get(`answer-${i}`) as string;
				answers.push(answer || '');
			}

			// Get categories from database - use same logic as load function
			const timezone = 'UTC';
			const now = new Date();
			const today = new Intl.DateTimeFormat('en-CA', {
				timeZone: timezone,
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			}).format(now);

			const todaysCategories = await db
				.select({
					category: categories.category,
					order: dailyCategories.order
				})
				.from(dailyCategories)
				.innerJoin(categories, eq(dailyCategories.categoryId, categories.id))
				.where(eq(dailyCategories.date, today))
				.orderBy(dailyCategories.order);

			// Format answers for AI prompt
			const useableData = todaysCategories
				.map((cat, index) => `${index + 1}. ${cat.category}: ${answers[index] || ''}`)
				.join('\n');

			// Create AI prompt
			const prompt = GAME_PROMPT(letter, useableData);

			// Generate AI response
			const result = await generateText({
				model: openai('gpt-4o'),
				prompt
			});

			// Parse the JSON response
			const responseText = result.text.trim();
			console.log('AI Response:', responseText);
			
			// Clean and parse JSON array
			let cleanResponse = responseText;
			if (cleanResponse.startsWith('```')) {
				cleanResponse = cleanResponse.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
			}
			
			const arrayMatch = cleanResponse.match(/\[.*\]/);
			if (arrayMatch) {
				const validationResults = JSON.parse(arrayMatch[0]);
				console.log('Parsed validation results:', validationResults);
				return { success: true, validationResults };
			} else {
				throw new Error('No valid JSON array found in AI response');
			}
		} catch (error) {
			console.error('Error in validate action:', error);
			return { success: false, error: 'Validation failed' };
		}
	}
};
