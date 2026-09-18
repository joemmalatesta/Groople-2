const LAST_PLAYED_KEY = 'lastPlayed';
const ANSWERS_KEY = 'answers';
const INPUT_KEY = 'input';
const SCORES_KEY = 'scores';
const YES_COUNT_KEY = 'yesCount';
const REPEAT_PLAYER_KEY = 'repeatPlayer';
const STREAK_KEY = 'streak';
const TOMORROW_KEY = 'tomorrow';

const EMPTY_SCORES: Record<string, number> = {
	'0': 0,
	'1': 0,
	'2': 0,
	'3': 0,
	'4': 0,
	'5': 0,
	'6': 0,
	'7': 0,
	'8': 0,
	'9': 0,
	'10': 0,
	'11': 0,
	'12': 0
};

export type LocalPlaySnapshot = {
	answers: string[];
	validationResults: boolean[];
};

export function hasLocalHistory(): boolean {
	return Boolean(localStorage.getItem(LAST_PLAYED_KEY) || localStorage.getItem(SCORES_KEY));
}

export function hasPlayedToday(now = new Date()): boolean {
	return localStorage.getItem(LAST_PLAYED_KEY) === localPlayDate(now);
}

export function localPlayDate(now = new Date()): string {
	return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function tomorrowPlayDate(now = new Date()): string {
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	return localPlayDate(tomorrow);
}

export function isYesVerdict(value: string): boolean {
	const verdict = value.trim().toLowerCase();
	return verdict === 'yes' || verdict === 'noyes';
}

export function parseStoredInputLine(line: string): string {
	const parts = line.split(':');
	const raw = parts.length >= 3 ? parts.slice(2).join(':').trim() : line.trim();
	return raw === 'ZZZZZZ' ? '' : raw;
}

function parseJsonArray(value: string | null): unknown[] | null {
	if (!value) {
		return null;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function padTwelve<T>(values: T[], fallback: T): T[] {
	return Array.from({ length: 12 }, (_, index) => values[index] ?? fallback);
}

export function readTodaysLocalPlay(): LocalPlaySnapshot | null {
	if (localStorage.getItem(LAST_PLAYED_KEY) !== localPlayDate()) {
		return null;
	}

	const storedAnswers = parseJsonArray(localStorage.getItem(ANSWERS_KEY));
	const storedInputs = parseJsonArray(localStorage.getItem(INPUT_KEY));
	if (!storedAnswers || !storedInputs) {
		return {
			answers: Array.from({ length: 12 }, () => ''),
			validationResults: Array.from({ length: 12 }, () => false)
		};
	}

	return {
		answers: padTwelve(
			storedInputs.map((line) => parseStoredInputLine(String(line ?? ''))),
			''
		),
		validationResults: padTwelve(
			storedAnswers.map((verdict) => isYesVerdict(String(verdict ?? ''))),
			false
		)
	};
}

export function readPersonalHistogram(): number[] {
	const scores = readScores();
	return Array.from({ length: 13 }, (_, index) => Number(scores[String(index)] ?? 0));
}

function readScores(): Record<string, number> {
	try {
		const parsed: unknown = JSON.parse(localStorage.getItem(SCORES_KEY) ?? 'null');
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			return { ...EMPTY_SCORES, ...(parsed as Record<string, number>) };
		}
	} catch {
		// Fall through to a fresh histogram.
	}

	return { ...EMPTY_SCORES };
}

function updateStreak(today: string, yesCount: number): void {
	const existingStreak = localStorage.getItem(STREAK_KEY);
	if (!existingStreak) {
		localStorage.setItem(STREAK_KEY, yesCount > 0 ? '1' : '0');
	}

	const storedTomorrow = localStorage.getItem(TOMORROW_KEY);
	if (today === storedTomorrow) {
		if (yesCount > 0) {
			const streak = Number.parseInt(existingStreak ?? '0', 10) || 0;
			localStorage.setItem(STREAK_KEY, String(streak + 1));
		} else {
			localStorage.setItem(STREAK_KEY, '0');
		}
	} else if (today !== storedTomorrow) {
		localStorage.setItem(STREAK_KEY, yesCount > 0 ? '1' : '0');
	}

	localStorage.setItem(TOMORROW_KEY, tomorrowPlayDate());
}

function writeBoard(params: {
	categories: string[];
	answers: string[];
	validationResults: boolean[];
}): void {
	const inputLines = params.categories.map((category, index) => {
		const answer = (params.answers[index] ?? '').trim();
		return `${index + 1} : ${category}: ${answer.length > 0 ? answer : 'ZZZZZZ'}`;
	});
	const verdicts = params.validationResults.map((correct) => (correct ? 'yes' : 'no'));

	localStorage.setItem(INPUT_KEY, JSON.stringify(inputLines));
	localStorage.setItem(ANSWERS_KEY, JSON.stringify(verdicts));
	localStorage.setItem(REPEAT_PLAYER_KEY, 'true');
	localStorage.setItem(LAST_PLAYED_KEY, localPlayDate());
}

export function syncLocalPlayBoard(params: {
	categories: string[];
	answers: string[];
	validationResults: boolean[];
}): void {
	writeBoard(params);

	if (localStorage.getItem(SCORES_KEY)) {
		if (!localStorage.getItem(YES_COUNT_KEY)) {
			localStorage.setItem(
				YES_COUNT_KEY,
				String(params.validationResults.filter(Boolean).length)
			);
		}
		return;
	}

	const yesCount = params.validationResults.filter(Boolean).length;
	const scores = { ...EMPTY_SCORES };
	scores[String(yesCount)] = 1;
	localStorage.setItem(YES_COUNT_KEY, String(yesCount));
	localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
	updateStreak(localPlayDate(), yesCount);
}

export function recordLocalPlay(params: {
	categories: string[];
	answers: string[];
	validationResults: boolean[];
}): void {
	const today = localPlayDate();
	if (localStorage.getItem(LAST_PLAYED_KEY) === today) {
		return;
	}

	const yesCount = params.validationResults.filter(Boolean).length;
	const scores = readScores();
	const bucket = String(yesCount);
	scores[bucket] = Number(scores[bucket] ?? 0) + 1;
	localStorage.setItem(YES_COUNT_KEY, String(yesCount));
	localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
	updateStreak(today, yesCount);
	writeBoard(params);
}
