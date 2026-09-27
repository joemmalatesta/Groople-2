import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

function inlineWasm(): Plugin {
	return {
		name: 'inline-wasm',
		enforce: 'pre',
		load(id) {
			const file = id.split('?')[0];
			if (!file?.endsWith('.wasm') || !id.includes('inline')) return null;
			const base64 = readFileSync(file).toString('base64');
			return `export default ${JSON.stringify(base64)};`;
		}
	};
}

export default defineConfig({
	plugins: [inlineWasm(), tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
