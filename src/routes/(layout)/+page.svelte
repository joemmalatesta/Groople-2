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
	let responseArray: boolean[] = [];
	let answerArray: string[] = [];
	let answersSubmitted = false;
	let modalActive = false;
	let formElement: HTMLFormElement;
	let validationResults: boolean[] = [];
	let isValidating = false;

	// Scroll position tracking for smooth transitions
	let scrollPosition = 0;

	// Redirect to include timezone parameter if not present
	onMount(() => {
		if (browser && !window.location.search.includes('tz=')) {
			const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			goto(`?tz=${encodeURIComponent(timezone)}`, { replaceState: true });
		}

		// Initialize scroll position immediately
		scrollPosition = window.scrollY;

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

	function handleValidationResponse(result: any) {
		console.log('Validation result:', result);

		if (result.type === 'success' && result.data?.validationResults) {
			validationResults = result.data.validationResults;
			responseArray = validationResults;
			answersSubmitted = true;
			console.log('Validation results:', validationResults);
			console.log('Response array:', responseArray);
		} else {
			console.error('Validation failed:', result.data?.error || 'Unknown error');
		}
	}
</script>

<main class="mx-auto min-h-screen max-w-3xl">
	<!-- Always visible top bar -->
	<div
		class="sticky top-0 z-10 flex items-center justify-between bg-light/60 px-4 backdrop-blur-sm dark:bg-dark/60"
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
				action="?/validate"
				use:enhance={() =>
					async ({ result, update }) => {
						isValidating = true;
						await update();
						handleValidationResponse(result);
						isValidating = false;
					}}
				class="w-full"
			>
				<input type="text" value={letter} class="hidden" name="letter" />
				{#each categories as category, index}
					{#key responseArray}
						<div class="w-full">
							<Category
								index={index + 1}
								{category}
								{letter}
								valid={responseArray[index] ? 'yes' : 'no'}
								{answersSubmitted}
								disabled={modalActive}
							/>
						</div>
					{/key}
				{/each}
				<button
					type="submit"
					class="w-full cursor-pointer rounded-md bg-dark p-2 text-light outline disabled:cursor-not-allowed disabled:opacity-50 dark:bg-light dark:text-dark"
					disabled={isValidating}
				>
					{isValidating ? 'Validating...' : 'Submit'}
				</button>
			</form>
		</div>
	</div>
</main>
