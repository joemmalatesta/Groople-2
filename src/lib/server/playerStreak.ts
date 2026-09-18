export type StreakState = {
	lastPlayedOn: string | null;
	streak: number;
	maxStreak: number;
};

export function addUtcDays(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	if (!year || !month || !day) {
		throw new Error(`Invalid date: ${isoDate}`);
	}

	const date = new Date(Date.UTC(year, month - 1, day));
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

export function streakAfterPlay(
	state: StreakState,
	puzzleDate: string,
	scored: boolean
): StreakState {
	if (state.lastPlayedOn === puzzleDate) {
		return {
			lastPlayedOn: puzzleDate,
			streak: state.streak,
			maxStreak: state.maxStreak
		};
	}

	const consecutive =
		state.lastPlayedOn !== null && addUtcDays(state.lastPlayedOn, 1) === puzzleDate;
	const streak = scored ? (consecutive ? state.streak + 1 : 1) : 0;

	return {
		lastPlayedOn: puzzleDate,
		streak,
		maxStreak: Math.max(state.maxStreak, streak)
	};
}
