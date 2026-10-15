export const REBUTTAL_YES_FLOOR = 0.4;
/** A category score at this line is a point. Matches the grader's yes threshold. */
export const REBUTTAL_YES_CEILING = 0.6;
/** At or above this line the wording is hidden and gets no rebuttal. */
export const PROFANE_HIDE_AT = 0.6;
export const MAX_REBUTTALS_PER_PLAY = 2;
export const MAX_CARDS_PER_VISIT = 3;
/** Judging opens once a player has finished this many puzzles. */
export const MIN_PLAYS_TO_JUDGE = 2;

export type RebuttalStatus = 'open' | 'yes' | 'no';
export type RebuttalVoteSide = 'yes' | 'no';

export type RebuttalCard = {
	id: string;
	letter: string;
	category: string;
	answer: string;
};

export type RebuttalCandidate = {
	answerId: string;
	yesProbability: number | null;
	profaneProbability: number | null;
};

export function isInRebuttalBand(
	yesProbability: number | null,
	profaneProbability: number | null
): boolean {
	return (
		yesProbability != null &&
		yesProbability > REBUTTAL_YES_FLOOR &&
		yesProbability < REBUTTAL_YES_CEILING &&
		(profaneProbability == null || profaneProbability < PROFANE_HIDE_AT)
	);
}

export function pickRebuttalAnswerIds(candidates: RebuttalCandidate[]): string[] {
	return candidates
		.filter(
			(candidate) =>
				candidate.answerId.length > 0 &&
				isInRebuttalBand(candidate.yesProbability, candidate.profaneProbability)
		)
		.sort((left, right) => (right.yesProbability ?? 0) - (left.yesProbability ?? 0))
		.slice(0, MAX_REBUTTALS_PER_PLAY)
		.map((candidate) => candidate.answerId);
}

/**
 * Close when one side reaches two votes. A 1–1 stays open.
 * A case that is already yes or no stays there.
 */
export function resolveRebuttal(status: RebuttalStatus, votes: RebuttalVoteSide[]): RebuttalStatus {
	if (status !== 'open') {
		return status;
	}

	const yeses = votes.filter((vote) => vote === 'yes').length;
	const nos = votes.length - yeses;
	if (yeses >= 2 && yeses > nos) {
		return 'yes';
	}
	if (nos >= 2 && nos > yeses) {
		return 'no';
	}
	return 'open';
}
