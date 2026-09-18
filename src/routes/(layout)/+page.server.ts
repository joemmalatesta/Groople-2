import type { Actions, PageServerLoad } from './$types';
import { LETTERS } from '$lib/constants';
import { gradeAnswers } from '$lib/server/gradeAnswers';
import { loadOrCreatePuzzle } from '$lib/server/loadOrCreatePuzzle';
import { localDateInTimezone } from '$lib/server/localDate';
import { persistPlay } from '$lib/server/persistPlay';
import { parsePlayerId } from '$lib/playerId';

function parseTimeRemainingMs(value: FormDataEntryValue | null): number {
	const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
	if (!Number.isFinite(parsed)) {
		return 0;
	}
	return Math.min(100_000, Math.max(0, parsed));
}

export const load: PageServerLoad = async ({ url }) => {
	const timezone = url.searchParams.get('tz') || 'UTC';
	const puzzle = await loadOrCreatePuzzle(localDateInTimezone(timezone));

	return {
		categories: puzzle.slots.map((slot) => slot.category),
		letter: puzzle.letter || LETTERS[0]
	};
};

export const actions: Actions = {
	validate: async ({ request, fetch }) => {
		try {
			const formData = await request.formData();
			const timezone = (formData.get('tz') as string) || 'UTC';
			const playerId = parsePlayerId(formData.get('player_id'));
			const timeRemainingMs = parseTimeRemainingMs(formData.get('time_remaining_ms'));

			const answers: string[] = [];
			for (let i = 1; i <= 12; i += 1) {
				answers.push((formData.get(`answer-${i}`) as string) || '');
			}

			const puzzle = await loadOrCreatePuzzle(localDateInTimezone(timezone));
			const grade = await gradeAnswers({
				letter: puzzle.letter,
				categories: puzzle.slots.map((slot) => slot.category),
				answers,
				fetch
			});

			await persistPlay({
				puzzle,
				playerId,
				answers,
				grade,
				timeRemainingMs
			});

			return {
				success: true,
				validationResults: grade.correct,
				answers,
				nouls: grade.nouls
			};
		} catch (error) {
			console.error('Error in validate action:', error);
			return { success: false, error: 'Validation failed' };
		}
	}
};
