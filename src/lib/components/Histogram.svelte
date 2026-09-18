<script lang="ts">
	export let counts: number[];
	export let highlight: number;
	export let variant: 'rows' | 'columns' | 'lockin' | 'overlay' = 'rows';
	export let overlay: number[] | null = null;
	export let onDark = false;

	$: max = Math.max(1, ...counts, ...(overlay ?? []));
	$: ticks = yTicks(max);

	function yTicks(top: number): number[] {
		if (top <= 4) {
			return Array.from({ length: top + 1 }, (_, index) => top - index);
		}

		const mid = Math.round(top / 2);
		return [top, mid, 0];
	}

	function width(count: number): string {
		return `${Math.max(count > 0 ? 6 : 0, Math.round((count / max) * 100))}%`;
	}

	function height(count: number): string {
		if (count <= 0) {
			return '0%';
		}

		return `${Math.round((count / max) * 100)}%`;
	}

</script>

{#if variant === 'columns' || variant === 'overlay'}
	<div class="flex gap-1.5">
		<div class="flex h-36 w-4 shrink-0 flex-col justify-between">
			{#each ticks as tick}
				<span class="text-right text-[10px] leading-none tabular-nums text-gray-400">{tick}</span>
			{/each}
		</div>
		<div class="min-w-0 flex-1">
			<div class="flex h-36 items-end gap-1">
				{#each counts as count, index}
					<div class="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
						{#if overlay}
							<div
								class="absolute bottom-0 w-full rounded-sm bg-gray-300 dark:bg-gray-600"
								style="height: {height(overlay[index] ?? 0)}"
							></div>
						{/if}
						<div
							class="relative w-full rounded-sm {index === highlight
								? onDark
									? 'bg-light'
									: 'bg-dark dark:bg-light'
								: overlay
									? onDark
										? 'bg-light/50'
										: 'bg-dark/50 dark:bg-light/50'
									: onDark
										? 'bg-light/30'
										: 'bg-gray-400 dark:bg-gray-500'}"
							style="height: {height(count)}"
						></div>
						<span
							role="tooltip"
							class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-md bg-dark px-2 py-1 text-center text-xs text-light opacity-0 shadow-lg transition-opacity delay-0 duration-0 group-hover:opacity-100 group-hover:delay-500"
						>
							{count}
						</span>
					</div>
				{/each}
			</div>
			<div class="mt-1 flex gap-1">
				{#each counts as _, index}
					<span
						class="min-w-0 flex-1 text-center text-[10px] {index === highlight
							? onDark
								? 'font-semibold text-light'
								: 'font-semibold text-dark dark:text-light'
							: onDark
								? 'text-light/40'
								: 'text-gray-400'}">{index}</span
					>
				{/each}
			</div>
		</div>
	</div>
{:else if variant === 'lockin'}
	<div class="flex flex-col gap-1">
		{#each counts as count, index}
			<div class="flex items-center gap-2">
				<span
					class="w-5 text-right text-xs {index === highlight
						? 'font-semibold text-dark dark:text-light'
						: 'text-gray-400'}">{index}</span
				>
				<div class="h-5 flex-1 rounded-md bg-neutral-100 dark:bg-neutral-900">
					<div
						class="h-full rounded-md {index === highlight
							? 'bg-neutral-300 dark:bg-neutral-600'
							: 'bg-neutral-200 dark:bg-neutral-800'}"
						style="width: {width(count)}"
					></div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col gap-1.5">
		{#each counts as count, index}
			<div class="flex items-center gap-2">
				<span
					class="w-5 text-right text-xs tabular-nums {index === highlight
						? 'font-semibold text-dark dark:text-light'
						: 'text-gray-400'}">{index}</span
				>
				<div class="h-3 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
					<div
						class="h-full rounded-full {index === highlight
							? 'bg-dark dark:bg-light'
							: 'bg-gray-400 dark:bg-gray-500'}"
						style="width: {width(count)}"
					></div>
				</div>
			</div>
		{/each}
	</div>
{/if}
