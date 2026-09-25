<script lang="ts">
	import Fire from 'phosphor-svelte/lib/Fire';
	import Histogram from '$lib/components/Histogram.svelte';
	import { sampleResult, scoreOf } from '$lib/preview/shareCopy';

	export let mark: string;

	const score = scoreOf(sampleResult);
	const counts = [1, 0, 1, 2, 2, 4, 6, 8, 7, 5, 3, 2, 1];
</script>

<div class="w-full rounded-2xl bg-light px-6 py-7 shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
	<div class="mb-1 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs text-dark dark:bg-neutral-800 dark:text-light">JM</span>
			<span class="text-sm text-dark dark:text-light">Joe</span>
		</div>
		<span class="text-xs uppercase tracking-widest text-gray-400">World</span>
	</div>

	<div class="mt-4 grid grid-cols-3 gap-2 text-center">
		<div>
			<h2 class="m-0 text-5xl text-dark dark:text-light">{score}</h2>
			<p class="mt-1 text-xs uppercase tracking-widest text-gray-400">Score</p>
		</div>
		<div>
			<h2 class="m-0 text-5xl text-dark dark:text-light">{sampleResult.streak}</h2>
			<p class="mt-1 flex items-center justify-center gap-1 text-xs uppercase tracking-widest text-gray-400">
				<svelte:component this={Fire} size={12} weight="fill" /> Streak
			</p>
		</div>
		<button type="button" class="cursor-pointer rounded-xl px-1 py-1 hover:bg-neutral-200/70 dark:hover:bg-neutral-800">
			<p class="m-0 text-5xl leading-none">{mark}</p>
			<p class="mt-2 text-xs uppercase tracking-widest text-gray-400">Share</p>
		</button>
	</div>

	<div class="mt-8">
		<Histogram {counts} highlight={score} variant="columns" />
	</div>
	<p class="mt-6 text-center text-sm text-gray-400">
		{sampleResult.dateLabel}<span class="mx-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle"></span>Play again tomorrow
	</p>
</div>
