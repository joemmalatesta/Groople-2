import { noul, TypeSafeClient, type Fetch, type NoulQuestion } from '@typesafe-ai/sdk';
import { env } from '$env/dynamic/private';
import { startsWithRequiredLetter } from './letterCheck';

export { startsWithRequiredLetter };

/** Probability of yes at or above this counts as a correct answer. Tune against real games. */
export const VALID_YES_PROBABILITY_THRESHOLD = 0.6;

export type GradeResult = {
	correct: boolean[];
	yesProbabilities: Array<number | null>;
};

function getClient(fetchFn?: Fetch): TypeSafeClient {
	if (!env.TYPESAFE_API_KEY) {
		throw new Error('TYPESAFE_API_KEY is not set');
	}

	return new TypeSafeClient({
		apiKey: env.TYPESAFE_API_KEY,
		timeout: 30_000,
		...(fetchFn ? { fetch: fetchFn } : {})
	});
}

type AnswerSlot = {
	index: number;
	category: string;
	response: string;
};

/**
 * Boundary cases every answer is judged against. Passed once in state so the
 * shots are not copied onto each question.
 */
const examples = {
	pass: [
		{ category: 'Foods', response: 'Pear' },
		{ category: 'Ice cream flavors', response: 'Pink lemonade' },
		{ category: 'Ice cream flavors', response: 'Rocky Road' },
		{
			category: 'Vegetables',
			response: 'Green beans',
			note: 'Green is part of the name.'
		},
		{
			category: 'Vehicles',
			response: 'Konesegg',
			note: 'Light misspelling of Koenigsegg.'
		},
		{
			category: 'Household Chores',
			response: 'vaccuum',
			note: 'Light misspelling of vacuum. A small typo of an ordinary word passes the same way a brand typo does.'
		},
		{
			category: 'Book titles',
			response: "King's Speec",
			note: 'Light misspelling of a real title.'
		},
		{
			category: 'Hobbies',
			response: 'punch needling',
			note: 'A specific hobby passes even if it is unfamiliar.'
		},
		{ category: 'Languages', response: 'Irish' },
		{
			category: 'Household Chores',
			response: 'Vacuuming',
			note: 'The chore itself starts with the letter.'
		},
		{
			category: 'Reasons to make a phone call',
			response: 'Just to say hi',
			note: 'A loose category. A sincere specific example passes.'
		}
	],
	fail: [
		{
			category: 'Ice cream flavors',
			response: 'Pear',
			note: 'A fruit. Pear fits Foods. It is not a flavor.'
		},
		{
			category: 'Ice cream flavors',
			response: 'Plum',
			note: 'A fruit, not a flavor. Pink lemonade is a flavor name and passes.'
		},
		{
			category: 'Diet foods',
			response: 'Pear',
			note: 'A food, not a diet food.'
		},
		{
			category: 'Household Chores',
			response: 'running the vaccuum',
			note: 'Fails for the letter R. Vacuuming is the chore. Running was added so the answer starts with R. The misspelling does not save it.'
		},
		{
			category: 'Vegetables',
			response: 'Giant carrot',
			note: 'Giant was added to hit the letter. Carrot is the vegetable.'
		},
		{
			category: 'Type of music',
			response: 'Piano',
			note: 'An instrument, not a type of music.'
		},
		{ category: 'Languages', response: 'Indian', note: 'Not a language. Irish is.' },
		{ category: 'Farm animals', response: 'Kangaroo', note: 'Not a farm animal.' },
		{ category: 'Book titles', response: 'Kingdom', note: 'Too generic to be a title.' }
	]
};

const criteria = {
	true: {
		what: 'An example of the category. A light misspelling of one still passes. An unfamiliar specific title, game, movie, brand, or name still passes. On a loose category, a sincere specific example passes.',
		like: '`examples.pass`'
	},
	false: {
		what: 'A different kind of thing, a generic word, or a leading adjective or other extra word added so the answer starts with the letter. That leading word passes only when it is part of the real name, as with Green beans. A misspelling does not fix a leading-word cheat or a category miss.',
		not_for:
			'Do not fail a specific title or name only because it is unfamiliar, or because of a light misspelling.',
		like: '`examples.fail`'
	}
};

/**
 * Grade Scattergories answers: exact letter matching in code, category/fairness
 * judgments from TypeSafe Noul questions in one batched request.
 */
export async function gradeAnswers(params: {
	letter: string;
	categories: string[];
	answers: string[];
	fetch?: Fetch;
}): Promise<GradeResult> {
	const count = params.categories.length;
	const correct = Array.from({ length: count }, () => false);
	const yesProbabilities: Array<number | null> = Array.from({ length: count }, () => null);
	const toJudge: AnswerSlot[] = [];

	for (let i = 0; i < count; i += 1) {
		const response = (params.answers[i] ?? '').trim();
		const category = params.categories[i] ?? '';
		if (!response || !startsWithRequiredLetter(response, params.letter)) {
			continue;
		}
		toJudge.push({ index: i, category, response });
	}

	if (toJudge.length === 0) {
		return { correct, yesProbabilities };
	}

	const answersState: Record<string, { category: string; response: string }> = {};
	const questions: Record<string, NoulQuestion> = {};

	for (const slot of toJudge) {
		const id = `answer_${slot.index + 1}`;
		answersState[id] = {
			category: slot.category,
			response: slot.response
		};
		questions[id] = noul(
			{
				question: `Is \`answers.${id}.response\` an example of \`answers.${id}.category\`?`,
				focus:
					'Apply the standard in `examples`. Those shots show the boundary. This response does not have to resemble their categories. It already starts with `required_letter`.'
			},
			criteria
		);
	}

	const client = getClient(params.fetch);
	const { answers } = await client.systemOne({
		model: 'jev-latest',
		state: {
			game: 'Scattergories',
			required_letter: params.letter.toUpperCase(),
			examples,
			answers: answersState
		},
		questions
	});

	for (const slot of toJudge) {
		const id = `answer_${slot.index + 1}`;
		const judgment = answers[id];
		if (judgment?.type !== 'noul') {
			continue;
		}
		yesProbabilities[slot.index] = judgment.noul;
		correct[slot.index] = judgment.noul >= VALID_YES_PROBABILITY_THRESHOLD;
	}

	return { correct, yesProbabilities };
}
