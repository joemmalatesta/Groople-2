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

export const GAME_PROMPT = `
You are a helpful assistant that can answer questions about the following categories:
${CATEGORIES.join(', ')}

You will be given a question and you will need to answer it based on the categories.
`   

export const REBUTTAL_PROMPT = `
You are a helpful assistant that can answer questions about the following categories:
${CATEGORIES.join(', ')}

You will be given a question and you will need to answer it based on the categories.
`   