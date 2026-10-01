<script lang="ts">
	export let seconds: number;
	export let active = true;

	const marks = [50, 25, 10, 3, 2, 1];

	$: show = active && marks.includes(seconds);
</script>

{#if show}
	{#key seconds}
		<div
			class="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
			aria-hidden="true"
		>
			<p
				class="text-6xl leading-none font-bold text-dark tabular-nums select-none motion-safe:animate-countdown sm:text-7xl md:text-8xl dark:text-light"
			>
				{seconds}
			</p>
		</div>
	{/key}
{/if}
