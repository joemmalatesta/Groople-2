<script lang="ts">
	export let scoring = false;

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
	{#each widths as width}
		{#if scoring}
			<div class="mb-1.5 flex animate-pulse items-center gap-3 rounded-md bg-neutral-200 px-3 py-3 dark:bg-neutral-800">
				<span class="h-3 w-4 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
				<span class="h-3 rounded-full bg-neutral-300 dark:bg-neutral-700 {width}"></span>
				<span class="ml-auto h-3 w-24 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
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
