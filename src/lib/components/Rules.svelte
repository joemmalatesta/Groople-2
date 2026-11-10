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
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center p-4"
		transition:fade={{ duration: 160 }}
	>
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
					<p>
						You get 100 seconds and 12 categories. Every answer has to start with the day's letter.
					</p>
					<p class="mt-2">
						An answer that fits its category is one point. You may not use adjectives that do not
						materially change the answer. Your score is how many of the 12 categories you answered
						correctly. The highlighted rows are the ones that were accepted by the judge.
					</p>
				</section>

				<section>
					<h3 class="text-lg font-medium text-dark dark:text-light">Rebuttals</h3>
					<p class="mt-2">
						Any rejected answer can be rebuttaled and sent to other players for voting. You can
						rebuttal up to two answers per day. Voters see the category and answer, and vote yes or no. You may also be
						prompted to vote on rebuttals after you've played twice.
					</p>
					<p class="mt-2">
						After you send it, a green dot marks the yes votes and a red dot marks the no votes, and
						the answer is decided by a best of three voting (2 yeses and you get that point).
					</p>
				</section>
			</div>
		</div>
	</div>
{/if}
