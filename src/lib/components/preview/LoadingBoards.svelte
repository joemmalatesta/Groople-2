<script lang="ts">
	export let variant: 'rows' | 'header' | 'lines' | 'scan' | 'sheet';
	export let moment: 'open' | 'score';

	const widths = ['w-28', 'w-20', 'w-36', 'w-24', 'w-32', 'w-16', 'w-40', 'w-24'];
	const answers = ['Saturn', 'Seattle', '', 'Scissors', 'Sox', 'Spider', 'Scone', ''];
</script>

<div class="w-full">
	{#if variant === 'header' || variant === 'sheet'}
		<div class="mb-6 flex justify-around gap-7 pt-2">
			<div class="flex flex-col items-center gap-3">
				<span class="h-3 w-12 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800"></span>
				<span class="h-14 w-10 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800"></span>
			</div>
			<div class="flex flex-col items-center gap-3">
				<span class="h-3 w-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800"></span>
				<span class="h-14 w-16 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800"></span>
			</div>
		</div>
	{:else if moment === 'score' && variant === 'scan'}
		<div class="mb-4 h-0.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
			<div class="h-full w-1/3 animate-pulse rounded-full bg-dark dark:bg-light"></div>
		</div>
	{/if}

	<div class="flex flex-col {variant === 'sheet' ? 'rounded-2xl border border-gray-200 p-3 dark:border-gray-800' : ''}">
		{#each widths as width, index}
			{#if moment === 'open'}
				{#if variant === 'lines'}
					<div class="flex items-end gap-3 py-3">
						<span class="h-2 w-4 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
						<span class="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 {width}"></span>
						<span class="ml-auto h-px w-5/12 bg-neutral-300 dark:bg-neutral-700"></span>
					</div>
				{:else}
					<div class="flex items-center gap-3 py-2.5 {variant === 'rows' ? 'animate-pulse' : ''}">
						<span class="h-3 w-4 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
						<span class="h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 {width}"></span>
						<span class="ml-auto hidden h-8 w-5/12 rounded-md border-b border-neutral-300 dark:border-neutral-700 md:block"></span>
					</div>
				{/if}
			{:else if variant === 'scan'}
				<div class="mb-1.5 flex items-baseline gap-3 rounded-md px-3 py-2 {answers[index] ? 'animate-pulse bg-neutral-200/80 dark:bg-neutral-800' : 'opacity-40'}">
					<span class="min-w-6 text-base text-dark dark:text-light">{index + 1}.</span>
					<span class="h-3 rounded-full bg-neutral-300 dark:bg-neutral-700 {width}"></span>
					<span class="ml-auto text-base text-dark dark:text-light {answers[index] ? '' : 'italic text-gray-400'}">
						{answers[index] || 'Unanswered'}
					</span>
				</div>
			{:else if variant === 'lines'}
				<div class="flex items-end gap-3 py-3 opacity-60">
					<span class="text-sm text-gray-400">{index + 1}</span>
					<span class="text-sm text-dark dark:text-light">{answers[index] || '—'}</span>
					<span class="ml-auto h-px w-5/12 animate-pulse bg-dark dark:bg-light"></span>
				</div>
			{:else}
				<div class="mb-1.5 flex animate-pulse items-center gap-3 rounded-md bg-neutral-200 px-3 py-3 dark:bg-neutral-800">
					<span class="h-3 w-4 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
					<span class="h-3 rounded-full bg-neutral-300 dark:bg-neutral-700 {width}"></span>
					<span class="ml-auto h-3 w-24 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
				</div>
			{/if}
		{/each}
	</div>

	{#if moment === 'open'}
		<div class="mt-4 h-10 w-full animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800"></div>
	{:else}
		<div class="mt-4 flex h-10 w-full items-center justify-center rounded-md bg-dark text-sm text-light dark:bg-light dark:text-dark">
			Scoring
		</div>
	{/if}
</div>
