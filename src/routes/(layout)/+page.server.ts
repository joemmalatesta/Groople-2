import type { Actions } from './$types';
import { gradeAnswers } from '$lib/server/gradeAnswers';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { isValidTimeZone, localDateInTimezone } from '$lib/server/localDate';
import { getPlayForPlayerDate, persistPlay, recordPlayShare } from '$lib/server/persistPlay';
import {
	castRebuttalVote,
	offerRebuttalCard,
	rebuttalVisitIsFull,
	submitOwnRebuttal
} from '$lib/server/rebuttals';
import { isPlayerId, parsePlayerId } from '$lib/playerId';
import {
	findPlayerByMetadata,
	getPlayer,
	savePlayerFeedback,
	upsertPlayerProfile
} from '$lib/server/players';
import { getScoreboardStats } from '$lib/server/scoreboard';
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
				profane: existing.profane,
				rebuttalPositions: existing.rebuttalPositions,
				rebuttalVotes: existing.rebuttalVotes,
				yesProbabilities: existing.yesProbabilities,
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
				profane: saved.profane,
				rebuttalPositions: saved.rebuttalPositions,
				rebuttalVotes: saved.rebuttalVotes,
				yesProbabilities: saved.yesProbabilities,
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

	feedback: async ({ request }) => {
		try {
			const formData = await request.formData();
			const playerId = parsePlayerId(formData.get('player_id'));
			if (!playerId) {
				return { success: false, error: 'Could not save feedback' };
			}

			const email = typeof formData.get('email') === 'string' ? formData.get('email') : '';
			const body = typeof formData.get('body') === 'string' ? formData.get('body') : '';
			const player = await savePlayerFeedback({
				playerId,
				email: String(email),
				body: String(body)
			});

			return { success: true, player };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Could not save feedback';
			return { success: false, error: message };
		}
	},

	submitRebuttal: async ({ request }) => {
		try {
			const formData = await request.formData();
			const playerId = parsePlayerId(formData.get('player_id'));
			const timezone = readTimezone(formData);
			const position = Number.parseInt(String(formData.get('position') ?? ''), 10);
			if (!playerId || !timezone || !Number.isInteger(position)) {
				return { success: true, sent: false };
			}

			const result = await submitOwnRebuttal({
				playerId,
				today: localDateInTimezone(timezone),
				position
			});
			return { success: true, ...result };
		} catch (error) {
			console.error('Error in submitRebuttal action:', error);
			return { success: true, sent: false };
		}
	},

	share: async ({ request }) => {
		const formData = await request.formData();
		const playerId = parsePlayerId(formData.get('player_id'));
		const date = formData.get('date');
		if (!playerId || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return { success: false };
		}

		await recordPlayShare(playerId, date);
		return { success: true };
	},

	rebuttal: async ({ request }) => {
		try {
			const formData = await request.formData();
			const playerId = parsePlayerId(formData.get('player_id'));
			const timezone = readTimezone(formData);
			if (!playerId || !timezone) {
				return { success: true, card: null };
			}

			const today = localDateInTimezone(timezone);
			const vote = formData.get('vote');
			const rebuttalId = formData.get('rebuttal_id');
			if ((vote === 'yes' || vote === 'no') && isPlayerId(rebuttalId)) {
				await castRebuttalVote({
					playerId,
					rebuttalId,
					vote,
					today
				});
			}

			const seen = Number.parseInt(String(formData.get('seen') ?? '0'), 10);
			if (rebuttalVisitIsFull(Number.isFinite(seen) ? seen : 0)) {
				return { success: true, card: null };
			}

			const card = await offerRebuttalCard({ playerId, today });
			return { success: true, card };
		} catch (error) {
			console.error('Error in rebuttal action:', error);
			return { success: true, card: null };
		}
	},

	restore: async ({ request }) => {
		try {
			const formData = await request.formData();
			const metadata = typeof formData.get('metadata') === 'string' ? formData.get('metadata') : '';
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
