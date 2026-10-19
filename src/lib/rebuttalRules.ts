export const REBUTTAL_YES_FLOOR = 0.4;
/** A category score at this line is a point. Matches the grader's yes threshold. */
export const REBUTTAL_YES_CEILING = 0.6;
/** At or above this line the wording is hidden and gets no rebuttal. */
export const PROFANE_HIDE_AT = 0.6;
export const MAX_REBUTTALS_PER_PLAY = 2;
/** Cards one player can hold on one local day. Every rebuttal_votes row for that day counts. */
export const MAX_REBUTTAL_CARDS_PER_DAY = 3;
/** Judging opens once a player has finished this many puzzles. */
export const MIN_PLAYS_TO_JUDGE = 2;

/** A player can judge only after today's puzzle and at least one earlier one. */
export function canJudgeRebuttals(playCount: number, playedToday: boolean): boolean {
	return playedToday && playCount >= MIN_PLAYS_TO_JUDGE;
}

export type RebuttalStatus = 'open' | 'yes' | 'no';
export type RebuttalVoteSide = 'yes' | 'no';

/** A held or skipped row is not a ballot. Only these two can close a case. */
export function decidingVotes(votes: readonly string[]): RebuttalVoteSide[] {
	return votes.filter((vote): vote is RebuttalVoteSide => vote === 'yes' || vote === 'no');
}

export type RebuttalDrawCard = {
	fromToday: boolean;
	yeses: number;
	/** The author has no finished rebuttal, or the last one closed before yesterday. */
	authorWaiting: boolean;
};

/**
 * One entry per card, plus an extra copy for each nudge:
 * filed today, already has a yes, or the author is waiting on a result.
 */
export function rebuttalDrawEntries<T extends RebuttalDrawCard>(cards: readonly T[]): T[] {
	const entries: T[] = [];
	for (const card of cards) {
		entries.push(card);
		if (card.fromToday) {
			entries.push(card);
		}
		if (card.yeses > 0) {
			entries.push(card);
		}
		if (card.authorWaiting) {
			entries.push(card);
		}
	}
	return entries;
}

export function pickRebuttalDraw<T>(
	entries: readonly T[],
	random: () => number = Math.random
): T | null {
	if (entries.length === 0) {
		return null;
	}
	const index = Math.min(entries.length - 1, Math.floor(random() * entries.length));
	return entries[index] ?? null;
}

export type RebuttalCard = {
	id: string;
	letter: string;
	category: string;
	answer: string;
};

export function isRebuttalCard(value: unknown): value is RebuttalCard {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const card = value as Partial<RebuttalCard>;
	return (
		typeof card.id === 'string' &&
		typeof card.letter === 'string' &&
		typeof card.category === 'string' &&
		typeof card.answer === 'string'
	);
}

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
