<script lang="ts">
	import { onMount } from 'svelte';
	import Category from '$lib/components/Category.svelte';
	import Header from '$lib/components/Header.svelte';

	export let onComplete: () => void = () => {};
	export let onBack: () => void = () => {};

	const GAME_MS = 25_000;
	const letter = 'B';
	const categories = ['Animals', 'Breakfast foods', 'Cities'];
	const prefill = ['Bear', '', ''];

	let answers = [...prefill];
	let results: boolean[] = [];
	let submitted = false;
	let reveal = false;
	let remainingMs = GAME_MS;
	let startedAt = 0;
	let timerInterval: ReturnType<typeof setInterval> | undefined;
	let formElement: HTMLFormElement;

	$: timer = Math.floor(remainingMs / 1000);
	$: milliseconds = remainingMs % 1000;
	$: score = results.filter(Boolean).length;

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = undefined;
		}
	}

	function collectAnswers(): string[] {
		if (!formElement) {
			return answers;
		}

		return categories.map((_, index) => {
			const field = formElement.elements.namedItem(`answer-${index + 1}`);
			if (field instanceof HTMLInputElement) {
				return field.value;
			}
			return answers[index] ?? '';
		});
	}

	function grade(values: string[]): boolean[] {
		return values.map((value) => {
			const trimmed = value.trim();
			return trimmed.length > 0 && trimmed.toLowerCase().startsWith(letter.toLowerCase());
		});
	}

	function submitTutorial() {
		if (submitted) {
			return;
		}

		stopTimer();
		remainingMs = 0;
		answers = collectAnswers();
		results = grade(answers);
		submitted = true;
		reveal = true;
	}

	function syncTimer() {
		if (!startedAt || submitted) {
			return;
		}

		remainingMs = Math.max(0, GAME_MS - (Date.now() - startedAt));
		if (remainingMs === 0) {
			submitTutorial();
		}
	}

	onMount(() => {
		startedAt = Date.now();
		remainingMs = GAME_MS;
		timerInterval = setInterval(syncTimer, 50);

		const catchUp = () => syncTimer();
		document.addEventListener('visibilitychange', catchUp);
		window.addEventListener('focus', catchUp);
		return () => {
			document.removeEventListener('visibilitychange', catchUp);
			window.removeEventListener('focus', catchUp);
			stopTimer();
		};
	});
</script>

<div class="flex w-full flex-col items-center">
	<Header {letter} {timer} {milliseconds} />
	<p class="mt-2 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
		Fill in answers that start with {letter}. One's already done — you've got 25 seconds.
	</p>

	<form
		bind:this={formElement}
		class="mt-6 w-full"
		on:submit|preventDefault={submitTutorial}
	>
		{#each categories as category, index}
			<div class="w-full">
				<Category
					loading={false}
					index={index + 1}
					{category}
					{letter}
					valid={results[index] ? 'yes' : 'no'}
					answersSubmitted={submitted}
					disabled={false}
					recordedAnswer={answers[index] ?? ''}
					initialValue={prefill[index] ?? ''}
					locked={index === 0 && !submitted}
					reveal={reveal}
				/>
				{#if index === 0 && !submitted}
					<p class="mb-2 pl-6 text-xs text-gray-400">This one's filled in for you.</p>
				{/if}
			</div>
		{/each}

		{#if !submitted}
			<button
				type="submit"
				class="mb-5 mt-4 w-full cursor-pointer rounded-md bg-dark p-2 text-light dark:bg-light dark:text-dark"
			>
				Submit
			</button>
			<button
				type="button"
				class="mb-8 w-full text-sm text-gray-400 hover:text-dark dark:hover:text-light"
				on:click={onBack}
			>
				Back
			</button>
		{:else}
			<div class="mb-8 mt-6 text-center">
				<p class="text-3xl font-semibold text-dark dark:text-light">{score}/3</p>
				<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
					That's the idea. The daily puzzle has 12 categories and 100 seconds.
				</p>
				<button
					type="button"
					class="mt-6 w-full rounded-md bg-dark p-3 text-light dark:bg-light dark:text-dark"
					on:click={onComplete}
				>
					Start Daily Puzzle
				</button>
			</div>
		{/if}
	</form>
</div>
