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
			`Is \`answers.${id}.response\` a valid Scattergories answer for category \`answers.${id}.category\`?`,
			{
				true: 'A real, reasonably well-known example of the category that a typical group of players would accept.',
				false:
					'It does not belong in the category, is made-up or random, is too vague, or only works because a descriptive word was added to force a match with `required_letter`.'
			}
		);
	}

	const client = getClient(params.fetch);
	const { answers } = await client.systemOne({
		model: 'jev-latest',
		state: {
			game: 'Scattergories',
			required_letter: params.letter.toUpperCase(),
			rules: [
				'The player already passed a letter-prefix check in code; judge category fit and fairness only.',
				'Reject vague answers and answers that seem made up or random.',
				'Reject answers that unjustly use extra descriptive words to cheat.',
				'Be strict but fair.'
			],
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
