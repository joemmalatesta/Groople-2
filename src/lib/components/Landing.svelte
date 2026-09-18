<script lang="ts">
	export let name = '';
	export let firstVisit = true;
	export let dateLabel = '';
	export let onStart: () => void = () => {};
	export let onTutorial: () => void = () => {};

	$: greeting = firstVisit
		? name
			? `Welcome, ${name}`
			: 'Welcome to Groople'
		: name
			? `Welcome back, ${name}`
			: 'Welcome back';
</script>

<div class="flex flex-1 flex-col items-center justify-center px-4 text-center">
	{#if dateLabel}
		<p class="text-sm text-gray-400">{dateLabel}</p>
	{/if}
	<h1
		class="text-4xl font-semibold text-dark dark:text-light md:text-5xl {dateLabel ? 'mt-3' : ''}"
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
		{/if}
	</div>
</div>
