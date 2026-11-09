export type RebuttalTally = {
	position: number;
	yes: number;
	no: number;
};

export type SavedPlay = {
	answers: string[];
	validationResults: boolean[];
	score: number;
	timeRemainingMs: number;
	rebuttalPositions?: number[];
	rebuttalVotes?: RebuttalTally[];
	yesProbabilities?: (number | null)[];
	profane?: boolean[];
};
