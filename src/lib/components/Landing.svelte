<script lang="ts">
	import { unseenRebuttals } from '$lib/rebuttalInbox';

	export let name = '';
	export let firstVisit = true;
	export let dateLabel = '';
	export let onStart: () => void = () => {};
	export let onTutorial: () => void = () => {};
	export let onRebuttals: () => void = () => {};

	$: greeting = firstVisit
		? name
			? `Welcome, ${name}`
			: 'Welcome to Groople'
		: name
			? `Welcome back, ${name}`
			: 'Welcome back';
</script>

{#snippet rebuttalsButton()}
	<button
		type="button"
		class="relative w-full cursor-pointer rounded-md border border-gray-300 p-3 text-dark dark:border-gray-600 dark:text-light"
		on:click={onRebuttals}
	>
		Rebuttals
		{#if $unseenRebuttals > 0}
			<span
				class="absolute top-1/2 right-3 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-dark px-1 text-xs text-light dark:bg-light dark:text-dark"
			>
				{$unseenRebuttals}
			</span>
		{/if}
	</button>
{/snippet}

<div class="flex flex-1 flex-col items-center justify-center px-4 text-center">
	{#if dateLabel}
		<p class="text-sm text-gray-400">{dateLabel}</p>
	{/if}
	<h1
		class="max-w-full text-4xl font-semibold wrap-break-word text-dark md:text-5xl dark:text-light {dateLabel
			? 'mt-3'
			: ''}"
	>
		{greeting}
	</h1>
	<p class="mt-4 max-w-md text-base text-gray-500 dark:text-gray-400">
		12 categories. 100 seconds. Every answer starts with the same letter.
	</p>

	<div class="mt-10 flex w-full max-w-xs flex-col gap-3">
		{#if firstVisit}
			<button
				type="button"
				class="w-full cursor-pointer rounded-md bg-dark p-3 text-light dark:bg-light dark:text-dark"
				on:click={onTutorial}
			>
				Tutorial
			</button>
			{@render rebuttalsButton()}
			<button
				type="button"
				class="w-full cursor-pointer rounded-md border border-gray-300 p-3 text-dark dark:border-gray-600 dark:text-light"
				on:click={onStart}
			>
				Start Daily Puzzle
			</button>
		{:else}
			<button
				type="button"
				class="w-full cursor-pointer rounded-md bg-dark p-3 text-light dark:bg-light dark:text-dark"
				on:click={onStart}
			>
				Start Daily Puzzle
			</button>
			<button
				type="button"
				class="w-full cursor-pointer rounded-md border border-gray-300 p-3 text-dark dark:border-gray-600 dark:text-light"
				on:click={onTutorial}
			>
				Tutorial
			</button>
			{@render rebuttalsButton()}
		{/if}
	</div>
</div>
