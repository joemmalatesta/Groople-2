<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import X from 'phosphor-svelte/lib/X';

	export let open = false;
	export let onClose: () => void = () => {};

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-[60] flex items-center justify-center p-4" transition:fade={{ duration: 160 }}>
		<button
			type="button"
			class="absolute inset-0 bg-dark/50 dark:bg-black/60"
			aria-label="Close rules"
			on:click={onClose}
		></button>
		<div
			class="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-light px-6 py-6 shadow-2xl dark:bg-neutral-900"
			in:scale={{ duration: 220, start: 0.94, easing: cubicOut }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="rules-title"
		>
			<div class="flex items-start justify-between gap-4">
				<h2 id="rules-title" class="text-xl font-semibold text-dark dark:text-light">Rules</h2>
				<button
					type="button"
					class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
					aria-label="Close"
					on:click={onClose}
				>
					<X size={18} weight="bold" />
				</button>
			</div>

			<div class="mt-5 space-y-6 text-sm leading-relaxed text-dark/80 dark:text-light/80">
				<section>
					<h3 class="text-base font-medium text-dark dark:text-light">Scoring</h3>
					<p class="mt-2">
						You get 100 seconds and 12 categories. Every answer has to start with the day's letter.
					</p>
					<p class="mt-2">
						An answer that fits its category is one point. Your score is how many of the 12 you got.
						The highlighted rows are the ones that counted.
					</p>
				</section>

				<section>
					<h3 class="text-base font-medium text-dark dark:text-light">Rebuttals</h3>
					<p class="mt-2">
						A close call can be sent to other players. You get two a day. Tap Rebuttal on the right.
						They see the letter, the category, and the answer, and vote yes or no.
					</p>
					<p class="mt-2">
						The pill that replaces the button is that vote. Green fades in on the yes side, red on the
						no side. The gray numbers are yes, then no.
					</p>
					<p class="mt-2">
						Two votes that agree decide it. If they say yes, that answer becomes a point.
					</p>
				</section>
			</div>
		</div>
	</div>
{/if}
