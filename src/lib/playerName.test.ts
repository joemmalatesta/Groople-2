import { afterEach, describe, expect, it } from 'vitest';
import { nameInitials, readPlayerName, writePlayerName } from './playerName';

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

describe('playerName', () => {
	it('stores a trimmed name and initials', () => {
		expect(writePlayerName('  Joe  ')).toBe('Joe');
		expect(readPlayerName()).toBe('Joe');
		expect(nameInitials('Joe')).toBe('J');
		expect(nameInitials('Joe Malatesta')).toBe('JM');
	});

	it('clears an empty name', () => {
		writePlayerName('Joe');
		expect(writePlayerName('   ')).toBe('');
		expect(readPlayerName()).toBe('');
	});
});
