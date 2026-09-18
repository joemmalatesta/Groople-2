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
	import { getOrCreatePlayerId } from '$lib/playerId';

	export let data: PageData;

	const categories = data.categories;
	const letter = data.letter;

	let responseArray: boolean[] = [];
	let answerArray: string[] = categories.map(() => '');
	let answersSubmitted = false;
	let modalActive = false;
	let formElement: HTMLFormElement;
	let isValidating = false;
	let headerComponent: InstanceType<typeof Header> | null = null;
	let playerId = '';
	let timezone = 'UTC';
	let timeRemainingMs = 100_000;

	let scrollPosition = 0;

	onMount(() => {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		playerId = getOrCreatePlayerId();

		if (browser && !window.location.search.includes('tz=')) {
			goto(`?tz=${encodeURIComponent(timezone)}`, { replaceState: true });
		}

		scrollPosition = window.scrollY;

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

	function collectAnswers(): string[] {
		if (!formElement) {
			return answerArray;
		}

		return categories.map((_, index) => {
			const field = formElement.elements.namedItem(`answer-${index + 1}`);
			if (field instanceof HTMLInputElement) {
				return field.value;
			}
			return answerArray[index] ?? '';
		});
	}

	function handleValidationResponse(result: unknown) {
		if (
			typeof result === 'object' &&
			result !== null &&
			'type' in result &&
			result.type === 'success' &&
			'data' in result &&
			typeof result.data === 'object' &&
			result.data !== null &&
			'validationResults' in result.data &&
			Array.isArray(result.data.validationResults)
		) {
			const dataResult = result.data as {
				validationResults: boolean[];
				answers?: string[];
			};
			responseArray = dataResult.validationResults;
			if (Array.isArray(dataResult.answers)) {
				answerArray = dataResult.answers;
			}
			answersSubmitted = true;
		} else {
			console.error('Validation failed:', result);
		}
	}

	function handleTimerEnd() {
		if (formElement && !answersSubmitted) {
			formElement.requestSubmit();
		}
	}
</script>

<main class="mx-auto min-h-screen max-w-3xl">
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
			<Header {letter} inTopBar={true} onTimerEnd={handleTimerEnd} />
		</div>
		<ThemeToggle />
	</div>

	<div
		class="mb-6 transition-opacity duration-300 ease-out"
		style="opacity: {scrollPosition > 100 ? 0 : 1};"
	>
		<Header {letter} bind:this={headerComponent} onTimerEnd={handleTimerEnd} />
	</div>

	<div class="relative flex w-full flex-col items-center justify-center px-4">
		<div class="relative mt-5 flex w-full flex-col items-center {modalActive ? 'blur' : ''}">
			<form
				bind:this={formElement}
				method="POST"
				action="?/validate"
				use:enhance={({ formData }) => {
					isValidating = true;
					if (headerComponent) {
						headerComponent.stopTimer();
						timeRemainingMs = headerComponent.getTimeRemainingMs();
					}
					formData.set('time_remaining_ms', String(timeRemainingMs));
					answerArray = collectAnswers();
					return async ({ result, update }) => {
						await update({ reset: false });
						handleValidationResponse(result);
						isValidating = false;
					};
				}}
				class="w-full"
			>
				<input type="hidden" name="letter" value={letter} />
				<input type="hidden" name="tz" value={timezone} />
				<input type="hidden" name="player_id" value={playerId} />
				<input type="hidden" name="time_remaining_ms" value={timeRemainingMs} />
				{#each categories as category, index}
					<div class="w-full">
						<Category
							loading={isValidating}
							index={index + 1}
							{category}
							{letter}
							valid={responseArray[index] ? 'yes' : 'no'}
							{answersSubmitted}
							disabled={modalActive}
							recordedAnswer={answerArray[index] ?? ''}
						/>
					</div>
				{/each}
				<button
					type="submit"
					class="mb-5 w-full cursor-pointer rounded-md bg-dark p-2 text-light outline disabled:cursor-not-allowed disabled:opacity-50 dark:bg-light dark:text-dark"
					disabled={isValidating || answersSubmitted}
				>
					{isValidating ? 'Scoring...' : 'Submit'}
				</button>
			</form>
		</div>
	</div>
</main>
