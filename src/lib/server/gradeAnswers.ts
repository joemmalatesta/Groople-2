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
 * One illustration of each rule. None of these are taken from played answers.
 * Passed once in state so the shots are not copied onto each question.
 */
const examples = {
	pass: [
		{
			category: 'Foods',
			response: 'Pear',
			note: 'The answer is itself an example of the category.'
		},
		{
			category: 'Vegetables',
			response: 'Green beans',
			note: 'The first word is part of the real name.'
		},
		{
			category: 'Vegetables',
			response: 'Brocoli',
			note: 'A light misspelling of a real answer still passes.'
		},
		{
			category: 'Books',
			response: 'Stone Junction',
			note: 'A specific title or name passes even when it is unfamiliar.'
		},
		{
			category: 'Things you are afraid of',
			response: 'Thunder',
			note: 'A loose category. A sincere specific example passes.'
		}
	],
	fail: [
		{
			category: 'Foods',
			response: 'A pear',
			for_letter: 'A',
			note: 'A, an, and the do not count. The food is pear, which does not start with A.'
		},
		{
			category: 'Ice cream flavors',
			response: 'Pear',
			note: 'A nearby thing is not enough. A fruit is not a flavor.'
		},
		{
			category: 'Vegetables',
			response: 'Giant carrot',
			note: 'A word added only to hit the letter. The vegetable is carrot.'
		},
		{
			category: 'Movies',
			response: 'Good',
			note: 'A generic word is not an example.'
		}
	]
};

const criteria = {
	true: {
		what: 'The response is itself an example of the category. A light misspelling still passes. A specific title or name still passes when it is unfamiliar. On a loose category, a sincere specific example passes. A first word that is part of the real name passes.',
		like: '`examples.pass`'
	},
	false: {
		what: 'A different or neighboring kind of thing, a generic word, or a word added only so the answer starts with the letter. A, an, and the never count as that word. Each fail example illustrates one of these, and its for_letter applies only to that example.',
		not_for: 'Do not fail a specific title or name only because it is unfamiliar, or because of a light misspelling.',
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
