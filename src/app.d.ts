// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'phosphor-svelte/lib/Sun' {
	const Sun: any;
	export default Sun;
}

declare module 'phosphor-svelte/lib/Moon' {
	const Moon: any;
	export default Moon;
}

export {};
