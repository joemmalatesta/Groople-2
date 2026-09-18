<script lang="ts">
	export let letter: string;
	export let inTopBar: boolean = false;
	export let timer: number;
	export let milliseconds: number;

	let isHovered = false;
</script>

<div class="flex w-full justify-around gap-7 pt-4 pb-2">
	<div class="flex flex-col items-center">
		<h3
			class="m-0 text-dark dark:text-light {inTopBar
				? 'hidden'
				: 'mb-2 text-base md:mb-4 md:text-xl'} font-semibold underline"
		>
			Letter
		</h3>
		<div
			class="m-0 text-dark dark:text-light {inTopBar
				? 'text-2xl'
				: 'text-5xl md:text-6xl'} font-bold"
		>
			{letter?.toUpperCase()}
		</div>
	</div>

	<div class="flex w-16 flex-col items-center md:w-32">
		<h3
			class="m-0 text-dark dark:text-light {inTopBar
				? 'hidden'
				: 'mb-2 text-base md:mb-4 md:text-xl'} font-semibold underline"
		>
			Time
		</h3>
		<div
			class="m-0 text-dark dark:text-light {inTopBar
				? 'text-2xl'
				: 'text-5xl md:text-6xl'} relative cursor-pointer font-bold tabular-nums"
			role="button"
			tabindex="0"
			on:mouseenter={() => (isHovered = true)}
			on:mouseleave={() => (isHovered = false)}
		>
			{timer}
			<span
				class="absolute bottom-0 left-full flex items-end transition-opacity duration-300 ease-in-out {isHovered
					? 'opacity-80'
					: 'opacity-0'} {inTopBar ? 'text-sm' : 'text-lg md:text-2xl'}"
				>.{Math.floor(milliseconds / 10)
					.toString()
					.padStart(2, '0')}</span
			>
		</div>
	</div>
</div>
