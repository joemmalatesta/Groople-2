<script lang="ts">
	import type { PageData } from './$types';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Category from '$lib/components/Category.svelte';
	import Header from '$lib/components/Header.svelte';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { theme } from '$lib/stores/theme';

	export let data: PageData;

	// Use server-loaded data instead of hardcoded constants
	const categories = data.categories;
	const letter = data.letter;

	// Game state
	let responseArray: string[] = [];
	let answerArray: string[] = [];
	let answersSubmitted = false;
	let modalActive = false;
	let formElement: HTMLFormElement;

	// Scroll position tracking for smooth transitions
	let scrollPosition = 0;

	// Redirect to include timezone parameter if not present
	onMount(() => {
		if (browser && !window.location.search.includes('tz=')) {
			const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			goto(`?tz=${encodeURIComponent(timezone)}`, { replaceState: true });
		}

		// Throttled scroll listener for performance
		let ticking = false;
		const handleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					scrollPosition = window.scrollY;
					ticking = false;
				});
				ticking = true;
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function handleResponse(formData: any) {
		// Handle form submission response
		console.log('Form submitted:', formData);
	}
</script>

<main class="bg-app-light dark:bg-app-dark mx-auto min-h-screen max-w-3xl">
	<!-- Always visible top bar -->
	<div
		class="bg-app-light/95 dark:bg-app-dark/95 sticky top-0 z-10 flex items-center justify-between px-4 backdrop-blur-sm dark:border-gray-700"
	>
		{#if $theme === 'dark'}
			<img src="/favicon-light.svg" alt="Groople Logo" class="h-8 w-8" />
		{:else}
			<img src="/favicon.svg" alt="Groople Logo" class="h-8 w-8" />
		{/if}
		<div
			class="transition-all duration-300 ease-out"
			style="opacity: {scrollPosition > 100 ? 1 : 0}; transform: scale({scrollPosition > 100
				? 1
				: 0.8}); pointer-events: {scrollPosition > 100 ? 'auto' : 'none'};"
		>
			<Header {letter} inTopBar={true} />
		</div>
		<ThemeToggle />
	</div>

	<!-- Main header (fades out when scrolling) -->
	<div
		class="mb-6 transition-opacity duration-300 ease-out"
		style="opacity: {scrollPosition > 100 ? 0 : 1};"
	>
		<Header {letter} />
	</div>

	<div class="relative flex w-full flex-col items-center justify-center px-4">
		<div class="relative mt-5 flex flex-col items-center {modalActive ? 'blur' : ''} w-full">
			<form
				bind:this={formElement}
				method="POST"
				use:enhance={() =>
					async ({ result, update }) => {
						await update();
						if (result.type === 'success') handleResponse(result.data); // `result.data` === `form`
					}}
				class="w-full"
			>
				<!-- Have this here, so the letter is sent with the form details. I'm sure theres a better way -->
				<input type="text" value={letter} class="hidden" name="letter" />
				{#each categories as category, index}
					{#key responseArray}
						<div class="my-1 w-full">
							<Category
								index={index + 1}
								{category}
								{letter}
								valid={responseArray[index] ? responseArray[index].toLowerCase() : ''}
								{answersSubmitted}
								disabled={modalActive}
							/>
						</div>
					{/key}
				{/each}
			</form>
		</div>
	</div>
</main>
