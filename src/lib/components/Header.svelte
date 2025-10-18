<script lang="ts">
	import { onMount } from 'svelte';

	// Accept letter as a prop from parent component
	export let letter: string;
	export let inTopBar: boolean = false;

	let timer = 100;
	let milliseconds = 0;
	let timerInterval: NodeJS.Timeout;
	let isHovered = false;

	// Start the timer countdown
	function startTimer() {
		timerInterval = setInterval(() => {
			if (timer > 0) {
				milliseconds -= 20;
				if (milliseconds < 0) {
					milliseconds = 980;
					timer--;
				}
			} else {
				clearInterval(timerInterval);
			}
		}, 20);
	}

	onMount(() => {
		startTimer();

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});
</script>

<div class="flex w-full justify-around gap-7 pt-4 pb-2">
	<div class="flex flex-col items-center">
		<h3
			class="text-app-dark dark:text-app-light m-0 {inTopBar
				? 'hidden'
				: 'mb-2 text-base md:mb-4 md:text-xl'} font-semibold underline"
		>
			Letter
		</h3>
		<div
			class="text-app-dark dark:text-app-light m-0 {inTopBar
				? 'text-2xl'
				: 'text-5xl md:text-6xl'} font-bold"
		>
			{letter?.toUpperCase()}
		</div>
	</div>

	<div class="flex w-16 flex-col items-center md:w-32">
		<h3
			class="text-app-dark dark:text-app-light m-0 {inTopBar
				? 'hidden'
				: 'mb-2 text-base md:mb-4 md:text-xl'} font-semibold underline"
		>
			Time
		</h3>
		<div
			class="text-app-dark dark:text-app-light m-0 {inTopBar
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
