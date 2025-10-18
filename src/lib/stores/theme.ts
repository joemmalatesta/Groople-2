import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
	if (browser) {
		const stored = localStorage.getItem('theme');
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}
	}
	return 'light';
};

export const theme = writable<Theme>(getInitialTheme());

// Apply theme changes to DOM
export function applyTheme(currentTheme: Theme) {
	if (browser) {
		localStorage.setItem('theme', currentTheme);
		if (currentTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
}

// Subscribe and apply changes
if (browser) {
	theme.subscribe(applyTheme);
}

// Toggle function
export const toggleTheme = () => {
	theme.update((current) => (current === 'light' ? 'dark' : 'light'));
};
