export type PlayerProfile = {
	id: string;
	name: string | null;
	metadata: string | null;
	streak: number;
	maxStreak: number;
	lastPlayedOn: string | null;
	timezone: string | null;
};
