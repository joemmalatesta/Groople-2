import { afterEach, describe, expect, it } from 'vitest';
import {
	hasLocalHistory,
	hasPlayedToday,
	isYesVerdict,
	localPlayDate,
	parseStoredInputLine,
	readTodaysLocalPlay,
	recordLocalPlay,
	syncLocalPlayBoard,
	tomorrowPlayDate
} from './localPlay';

const memory = new Map<string, string>();

const localStorageMock = {
	getItem(key: string) {
		return memory.get(key) ?? null;
	},
	setItem(key: string, value: string) {
		memory.set(key, value);
	},
	removeItem(key: string) {
		memory.delete(key);
	},
	clear() {
		memory.clear();
	}
};

Object.defineProperty(globalThis, 'localStorage', {
	value: localStorageMock,
	configurable: true
});

afterEach(() => {
	memory.clear();
});

describe('localPlayDate', () => {
	it('matches original Groople unpadded YYYY-M-D', () => {
		expect(localPlayDate(new Date(2026, 8, 17))).toBe('2026-9-17');
		expect(tomorrowPlayDate(new Date(2026, 8, 17))).toBe('2026-9-18');
	});
});

describe('stored play format', () => {
	it('reads original Groople input lines and yes/noyes verdicts', () => {
		expect(parseStoredInputLine('8 : Companies: Johnson and Johnson')).toBe(
			'Johnson and Johnson'
		);
		expect(parseStoredInputLine('1 : Store Names: ZZZZZZ')).toBe('');
		expect(isYesVerdict('Yes')).toBe(true);
		expect(isYesVerdict('noyes')).toBe(true);
		expect(isYesVerdict('no')).toBe(false);
		expect(isYesVerdict('nono')).toBe(false);
	});
});

describe('recordLocalPlay', () => {
	it('blocks a second play the same day and keeps the histogram', () => {
		const categories = Array.from({ length: 12 }, (_, index) => `Cat ${index + 1}`);
		const answers = categories.map((_, index) => (index < 3 ? `Juice ${index}` : ''));
		const validationResults = answers.map((answer) => answer.length > 0);

		recordLocalPlay({ categories, answers, validationResults });
		expect(localStorage.getItem('lastPlayed')).toBe(localPlayDate());
		expect(localStorage.getItem('yesCount')).toBe('3');
		expect(JSON.parse(String(localStorage.getItem('scores')))['3']).toBe(1);

		recordLocalPlay({
			categories,
			answers: categories.map(() => 'Nope'),
			validationResults: categories.map(() => true)
		});

		expect(localStorage.getItem('yesCount')).toBe('3');
		expect(JSON.parse(String(localStorage.getItem('scores')))['3']).toBe(1);
		expect(JSON.parse(String(localStorage.getItem('scores')))['12']).toBe(0);
		expect(readTodaysLocalPlay()?.validationResults.filter(Boolean).length).toBe(3);
	});

	it('syncs a restored board without counting it again', () => {
		localStorage.setItem(
			'scores',
			JSON.stringify({
				'0': 0,
				'1': 0,
				'2': 1,
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
			})
		);
		localStorage.setItem('yesCount', '2');

		const categories = Array.from({ length: 12 }, (_, index) => `Cat ${index + 1}`);
		syncLocalPlayBoard({
			categories,
			answers: categories.map((_, index) => (index < 2 ? 'Juice' : '')),
			validationResults: categories.map((_, index) => index < 2)
		});

		expect(localStorage.getItem('lastPlayed')).toBe(localPlayDate());
		expect(localStorage.getItem('yesCount')).toBe('2');
		expect(JSON.parse(String(localStorage.getItem('scores')))['2']).toBe(1);
		expect(readTodaysLocalPlay()?.answers[0]).toBe('Juice');
	});

	it('adds today to an existing histogram when that bucket is empty', () => {
		localStorage.setItem(
			'scores',
			JSON.stringify({
				'0': 0,
				'1': 0,
				'2': 0,
				'3': 0,
				'4': 1,
				'5': 0,
				'6': 0,
				'7': 0,
				'8': 0,
				'9': 0,
				'10': 0,
				'11': 0,
				'12': 0
			})
		);

		const categories = Array.from({ length: 12 }, (_, index) => `Cat ${index + 1}`);
		syncLocalPlayBoard({
			categories,
			answers: categories.map((_, index) => (index < 3 ? 'Juice' : '')),
			validationResults: categories.map((_, index) => index < 3)
		});

		expect(JSON.parse(String(localStorage.getItem('scores')))['3']).toBe(1);
		expect(JSON.parse(String(localStorage.getItem('scores')))['4']).toBe(1);
	});

	it('reports history only after a play is stored', () => {
		expect(hasLocalHistory()).toBe(false);
		expect(hasPlayedToday()).toBe(false);
		recordLocalPlay({
			categories: Array.from({ length: 12 }, (_, index) => `Cat ${index + 1}`),
			answers: Array.from({ length: 12 }, () => ''),
			validationResults: Array.from({ length: 12 }, () => false)
		});
		expect(hasLocalHistory()).toBe(true);
		expect(hasPlayedToday()).toBe(true);
	});

	it('seeds the original scores histogram when none exists yet', () => {
		const categories = Array.from({ length: 12 }, (_, index) => `Cat ${index + 1}`);
		syncLocalPlayBoard({
			categories,
			answers: categories.map((_, index) => (index < 4 ? 'Juice' : '')),
			validationResults: categories.map((_, index) => index < 4)
		});

		expect(localStorage.getItem('yesCount')).toBe('4');
		expect(JSON.parse(String(localStorage.getItem('scores')))['4']).toBe(1);
		expect(localStorage.getItem('streak')).toBe('1');
	});
});
