import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { getOrCreatePlayerId } from '$lib/playerId';
import { readTodaysLocalPlay, syncLocalPlayBoard } from '$lib/localPlay';
import type { SavedPlay } from '$lib/savedPlay';
import type { PlayerProfile } from '$lib/playerProfile';
import type { ScoreboardStats } from '$lib/scoreboard';

export const ssr = false;

type PuzzleResponse = {
	date: string;
	categories: string[];
	letter: string;
	play: SavedPlay | null;
	player: PlayerProfile | null;
	scoreboard: ScoreboardStats | null;
};

export const load: PageLoad = async ({ fetch }) => {
	if (!browser) {
		return {
			date: '',
			categories: [] as string[],
			letter: '',
			play: null as SavedPlay | null,
			player: null as PlayerProfile | null,
			scoreboard: null as ScoreboardStats | null
		};
	}

	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const playerId = getOrCreatePlayerId();
	const response = await fetch('/api/puzzle', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json'
		},
		body: JSON.stringify({ tz, playerId })
	});

	if (!response.ok) {
		throw new Error("Failed to load today's puzzle");
	}

	const puzzle = (await response.json()) as PuzzleResponse;
	if (puzzle.play) {
		syncLocalPlayBoard({
			categories: puzzle.categories,
			answers: puzzle.play.answers,
			validationResults: puzzle.play.validationResults
		});
		if (puzzle.player) {
			localStorage.setItem('streak', String(puzzle.player.streak));
		}
		return puzzle;
	}

	const localPlay = readTodaysLocalPlay();
	return {
		...puzzle,
		play: localPlay
			? {
					...localPlay,
					score: localPlay.validationResults.filter(Boolean).length,
					timeRemainingMs: 0
				}
			: null
	};
};
