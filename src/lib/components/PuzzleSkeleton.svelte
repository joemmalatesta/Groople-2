<script lang="ts">
	export let scoring = false;
	export let answers: string[] = [];

	function answerLabel(answer: string | undefined): string {
		const trimmed = (answer ?? '').trim();
		return trimmed.length > 0 ? trimmed : 'Unanswered';
	}

	const widths = [
		'w-28',
		'w-20',
		'w-36',
		'w-24',
		'w-32',
		'w-16',
		'w-40',
		'w-24',
		'w-28',
		'w-36',
		'w-20',
		'w-32'
	];
</script>

<div class="w-full" aria-hidden="true">
	{#each widths as width, index}
		{#if scoring}
			<div
				class="mb-1.5 flex w-full animate-pulse flex-col gap-0.5 rounded bg-neutral-200 px-3 py-2 dark:bg-neutral-800 md:flex-row md:items-center md:gap-4"
			>
				<div class="flex min-w-0 items-center gap-2 md:flex-1">
					<span class="min-w-6 shrink-0 text-base font-medium text-transparent">{index + 1}.</span>
					<span class="h-4 rounded-sm bg-neutral-300 dark:bg-neutral-600 {width}"></span>
				</div>
				<div class="pl-8 md:w-7/12 md:pl-0">
					<span class="relative inline-block max-w-full text-base {(answers[index] ?? '').trim() ? '' : 'italic'}">
						<span class="invisible">{answerLabel(answers[index])}</span>
						<span class="absolute inset-x-0 inset-y-1 rounded-sm bg-neutral-300 dark:bg-neutral-600"></span>
					</span>
				</div>
			</div>
		{:else}
			<div class="flex animate-pulse items-center gap-3 py-2.5">
				<span class="h-3 w-4 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
				<span class="h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 {width}"></span>
				<span class="ml-auto hidden h-8 w-5/12 rounded-md border-b border-neutral-300 dark:border-neutral-700 md:block"></span>
			</div>
		{/if}
	{/each}
	{#if !scoring}
		<div class="mt-4 h-10 w-full animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800"></div>
	{/if}
</div>
