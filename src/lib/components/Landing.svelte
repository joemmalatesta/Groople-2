<script lang="ts">
	export let name = '';
	export let firstVisit = true;
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

<div class="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 text-center">
	<p class="text-sm uppercase tracking-[0.3em] text-gray-400">Daily word game</p>
	<h1 class="mt-3 text-4xl font-semibold text-dark dark:text-light md:text-5xl">{greeting}</h1>
	<p class="mt-4 max-w-md text-base text-gray-500 dark:text-gray-400">
		12 categories. 100 seconds. Every answer starts with the same letter.
	</p>

	<div class="mt-10 flex w-full max-w-xs flex-col gap-3">
		{#if firstVisit}
			<button
				type="button"
				class="w-full rounded-md bg-dark p-3 text-light dark:bg-light dark:text-dark"
				on:click={onTutorial}
			>
				Tutorial
			</button>
			<button
				type="button"
				class="w-full rounded-md border border-gray-300 p-3 text-dark dark:border-gray-600 dark:text-light"
				on:click={onStart}
			>
				Start Daily Puzzle
			</button>
		{:else}
			<button
				type="button"
				class="w-full rounded-md bg-dark p-3 text-light dark:bg-light dark:text-dark"
				on:click={onStart}
			>
				Start Daily Puzzle
			</button>
			<button
				type="button"
				class="w-full rounded-md border border-gray-300 p-3 text-dark dark:border-gray-600 dark:text-light"
				on:click={onTutorial}
			>
				Tutorial
			</button>
		{/if}
	</div>
</div>
