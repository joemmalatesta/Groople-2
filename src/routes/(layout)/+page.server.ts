import type { Actions } from './$types';
import { gradeAnswers } from '$lib/server/gradeAnswers';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { isValidTimeZone, localDateInTimezone } from '$lib/server/localDate';
import { getPlayForPlayerDate, persistPlay } from '$lib/server/persistPlay';
import {
	findPlayerByMetadata,
	getPlayer,
	upsertPlayerProfile
} from '$lib/server/players';
import { getScoreboardStats } from '$lib/server/scoreboard';
import { parsePlayerId } from '$lib/playerId';
import { parsePlayClient } from '$lib/playClient';

function parseTimeRemainingMs(value: FormDataEntryValue | null): number {
	const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
	if (!Number.isFinite(parsed)) {
		return 0;
	}
	return Math.min(100_000, Math.max(0, parsed));
}

function readTimezone(formData: FormData): string | null {
	const timezone = formData.get('tz');
	if (typeof timezone !== 'string' || !isValidTimeZone(timezone)) {
		return null;
	}
	return timezone;
}

export const actions: Actions = {
	validate: async ({ request, fetch }) => {
		try {
			const formData = await request.formData();
			const timezone = readTimezone(formData);
			if (!timezone) {
				return { success: false, error: 'Validation failed' };
			}
			const playerId = parsePlayerId(formData.get('player_id'));
			if (!playerId) {
				return { success: false, error: 'Validation failed' };
			}
			const timeRemainingMs = parseTimeRemainingMs(formData.get('time_remaining_ms'));
			const client = parsePlayClient(formData.get('client'), timezone);

			const answers: string[] = [];
			for (let i = 1; i <= 12; i += 1) {
				answers.push((formData.get(`answer-${i}`) as string) || '');
			}

			const puzzle = await loadOrCreatePuzzle(localDateInTimezone(timezone));
			const existing = await getPlayForPlayerDate(playerId, puzzle.date);
			if (existing) {
				return {
					success: true,
					alreadyPlayed: true,
					validationResults: existing.validationResults,
					answers: existing.answers,
					score: existing.score,
					timeRemainingMs: existing.timeRemainingMs,
					player: await getPlayer(playerId),
					scoreboard: await getScoreboardStats(puzzle.date, playerId, existing.score)
				};
			}

			const grade = await gradeAnswers({
				letter: puzzle.letter,
				categories: puzzle.slots.map((slot) => slot.category),
				answers,
				fetch
			});

			const saved = await persistPlay({
				puzzle,
				playerId,
				timezone,
				answers,
				grade,
				timeRemainingMs,
				client
			});

			return {
				success: true,
				validationResults: saved.validationResults,
				answers: saved.answers,
				score: saved.score,
				timeRemainingMs: saved.timeRemainingMs,
				player: await getPlayer(playerId),
				scoreboard: await getScoreboardStats(puzzle.date, playerId, saved.score)
			};
		} catch (error) {
			console.error('Error in validate action:', error);
			return { success: false, error: 'Validation failed' };
		}
	},

	profile: async ({ request }) => {
		try {
			const formData = await request.formData();
			const playerId = parsePlayerId(formData.get('player_id'));
			if (!playerId) {
				return { success: false, error: 'Could not save profile' };
			}

			const name = typeof formData.get('name') === 'string' ? formData.get('name') : '';
			const timezone = readTimezone(formData);

			const player = await upsertPlayerProfile({
				playerId,
				name: String(name),
				timezone
			});

			return { success: true, player };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Could not save profile';
			return { success: false, error: message };
		}
	},

	restore: async ({ request }) => {
		try {
			const formData = await request.formData();
			const metadata =
				typeof formData.get('metadata') === 'string' ? formData.get('metadata') : '';
			const player = await findPlayerByMetadata(String(metadata));
			if (!player) {
				return { success: false, error: 'No player found with that metadata' };
			}

			return { success: true, playerId: player.id, player };
		} catch (error) {
			console.error('Error in restore action:', error);
			return { success: false, error: 'Could not restore player' };
		}
	}
};
