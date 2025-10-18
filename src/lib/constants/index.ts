export const CATEGORIES = [
	'A Boy\'s Name',
	'U.S. Cities',
	'Things That Are Cold',
	'School Supplies',
	'Pro Sports Teams',
	'Insects',
	'Breakfast Foods',
	'Furniture',
	'T.V. Shows',
	'Things That Are Found in the Ocean',
	'Presidents',
	'Product Names',
	'Appliances'
]

export const LETTERS = 'abcdefghijklmnoprstw';

export const GAME_PROMPT = (letter: string, useableData: string) => `Welcome to Scattergories! You are the judge, and your task is to determine whether the player's responses match the category and start with the selected letter.

Rules:
- If the response is a valid match for the category and starts with "${letter}", respond true
- If the response does not match the category, doesn't start with "${letter}", or is a combination of just the letter and another word, respond false
- The response should not be vague and should not unjustly use descriptive words to cheat the system
- Respond false to answers that seem made up or random - they should be somewhat well known and something a group of players would agree on
- Be strict but fair in your judgment

Here are the 12 categories and answers for a player with the letter "${letter}":
${useableData}

The input is given as "Number. Category: Answer".

You must respond with a JSON array of exactly 12 boolean values in this exact format:
[true, false, true, false, true, false, true, false, true, false, true, false]

Example for letter "A":
Input: "1. A Boy's Name: Alex"
Output: [true]

Input: "2. U.S. Cities: Apple"  
Output: [false]

Respond with ONLY the JSON array, no other text, no markdown formatting, no code blocks.`;

export const REBUTTAL_PROMPT = (letter: string, useableData: string) => `
You are a helpful assistant that can answer questions about the following categories:
${CATEGORIES.join(', ')}
	`   