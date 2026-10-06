/**
 * Scattergories standard. General illustrations only.
 * None of these answers are taken from played games.
 * Passed once in state so the shots are not copied onto each question.
 */
export const examples = {
	pass: [
		{
			category: 'Vegetables',
			response: 'Green beans',
			note: 'The first word is part of the ordinary name.'
		},
		{
			category: 'Drinks',
			response: 'Iced tea',
			note: 'Iced tea is the name of the drink, so iced is not glue.'
		},
		{
			category: 'Furniture',
			response: 'Desk lamp',
			note: 'Desk is part of the name of that lamp.'
		},
		{
			category: 'Household objects',
			response: 'Bathroom mirror',
			note: 'A room word in front of one specific object stays. It is not glue.'
		},
		{
			category: 'Vegetables',
			response: 'Brocoli',
			note: 'A phonetic spelling passes when the real word already starts with the required letter.'
		},
		{
			category: 'Books',
			response: 'Stone Junction',
			note: 'An unfamiliar title passes.'
		},
		{
			category: 'Ice cream flavors',
			response: 'Mango',
			note: 'The flavor word is the whole answer, so it is not glue in front of another food.'
		},
		{
			category: 'Things that are round',
			response: 'Butt',
			note: 'Rude wording passes when the thing has the property.'
		}
	],
	fail: [
		{
			category: 'Drinks',
			response: 'Cold water',
			for_letter: 'C',
			note: 'Cold deletes. The drink is water.'
		},
		{
			category: 'Bakery foods',
			response: 'Lemon muffin',
			for_letter: 'L',
			note: 'Lemon is a flavor glued onto a finished food. Bakeries sell it. The food is a muffin, which does not start with L.'
		},
		{
			category: 'Date spots',
			response: 'Indoor cafe',
			for_letter: 'I',
			note: 'Indoor deletes. The place is a cafe.'
		},
		{
			category: 'Vehicles',
			response: 'Blue truck',
			for_letter: 'B',
			note: 'Blue deletes. The vehicle is a truck.'
		},
		{
			category: 'Chores',
			response: 'Running the dishwasher',
			for_letter: 'R',
			note: 'Running deletes. The chore is the dishwasher.'
		},
		{
			category: 'Car brands',
			response: 'Koyota',
			for_letter: 'K',
			note: 'Toyota starts with T. Inventing the first letter fails.'
		},
		{
			category: 'Animals',
			response: 'School',
			note: 'Use the everyday meaning. A school is where people learn. A group of fish does not count.'
		},
		{
			category: 'Breakfast foods',
			response: 'Morning sex',
			note: 'A joke fails when it is not itself an example.'
		},
		{
			category: 'Diet foods',
			response: 'Butter',
			note: 'A calorie-dense food is not a diet food.'
		},
		{
			category: 'Things you save up to buy',
			response: 'Gum',
			note: 'A cheap everyday thing fails a category about saving up.'
		}
	]
};

/** Checked from the top. The first hit decides. Item 1 wins over a familiar variety name. */
export const standard = [
	'Fail when the first word is a detachable modifier. A detachable modifier is an adjective or participle of color, flavor, temperature, size, age, texture, taste, plainness, or oddness, or a location adjective such as outdoor or indoor, or a leading verb. Removing it still leaves a grammatical answer, and that answer is what the player meant. A flavor or color in front of a finished food is detachable even when bakeries sell that variety. A location adjective in front of a place is detachable even when people say the phrase. This check wins over every later check.',
	'The first word is not detachable when it is part of the ordinary name of one specific thing. Green beans, cream cheese, iced tea, a desk lamp, and a bathroom mirror keep their first word.',
	'Fail when a changed first letter is what makes the spelling match the required letter. A phonetic spelling passes when the real word already starts with that letter.',
	'Fail on an animal category when the everyday meaning is a human. A specialist livestock sense does not save it.',
	'Fail when it is a neighboring kind of thing, a joke that is not itself an example, a word that names nothing, or a cheap everyday thing in a saving-up category. A, an, and the never count. A calorie-dense food is not a diet food. Oily is not sticky. A planet is not a constellation. A fish is not a drink. Clothing is not a computer part.',
	'Otherwise pass. An unfamiliar title, name, brand, place, or street passes. A loose category passes a sincere specific example. A fruit or candy people serve as a flavor passes when that flavor word is the whole answer. A low-calorie food passes as a diet food. A body part that has the property passes. An association people commonly make passes. Rude, sexual, or profane wording passes when the answer itself fits. An instrument passes as a music type. A host passes as their show.'
];

export const criteria = {
	true: {
		what: 'It survives every fail check in `standard` and is itself an example of the category.',
		like: '`examples.pass`'
	},
	false: {
		what: 'It hits a fail check in `standard`. A flavor, color, or location word glued onto a finished answer is a fail even when that variety is sold.',
		not_for:
			'Do not fail a lexicalized name. Do not fail an unfamiliar title, name, brand, or place. Do not fail rude wording that fits. Do not fail a phonetic spelling that keeps the original first letter.',
		like: '`examples.fail`'
	}
};

export const gradeFocus =
	'Apply `standard` from the top and stop at the first fail. Item 1 runs before any instinct that the phrase is a real variety people order. Familiarity does not survive item 1. Later items stay generous. This response already starts with `required_letter`.';
