<script lang="ts">
	import { fade } from 'svelte/transition';

	export let index: number;
	export let category: string;
	export let letter: string;
	export let valid: string;
	export let answersSubmitted: boolean;
	export let disabled: boolean;
	export let loading: boolean;
	export let recordedAnswer: string = '';
	export let initialValue = '';
	export let locked = false;
	export let reveal = true;

	let inputValue = initialValue;

	$: hasAnswer = recordedAnswer.trim().length > 0;
	$: displayAnswer = hasAnswer ? recordedAnswer.trim() : 'Unanswered';
	$: isCorrect = valid === 'yes';
	$: startsWithLetter = inputValue.toLowerCase().startsWith(letter.toLowerCase());
	$: fadeDelay = (index - 1) * 50;
	$: lockinClass = isCorrect
		? 'rounded-md bg-neutral-200 dark:bg-neutral-800'
		: 'opacity-45';
</script>

{#if answersSubmitted}
	<div
		class="mb-1.5 flex flex-col gap-0.5 px-3 py-2 md:flex-row md:items-baseline md:gap-4 {lockinClass}"
	>
		<div class="flex min-w-0 items-baseline gap-2 md:flex-1">
			<span class="min-w-6 shrink-0 text-base font-medium text-dark dark:text-light">{index}.</span>
			<span class="text-base font-medium text-dark dark:text-light">{category}</span>
		</div>
		{#if reveal}
			<p
				class="pl-8 text-base text-dark dark:text-light md:w-7/12 md:pl-0 {hasAnswer ? '' : 'italic'}"
				in:fade={{ delay: fadeDelay, duration: 280 }}
			>
				{displayAnswer}
			</p>
		{:else}
			<p
				class="pl-8 text-base text-dark dark:text-light md:w-7/12 md:pl-0 {hasAnswer ? '' : 'italic'}"
			>
				{displayAnswer}
			</p>
		{/if}
	</div>
{:else}
	<div class="flex flex-col justify-between py-1 md:flex-row md:items-center md:gap-4">
		<div class="flex items-center md:gap-2">
			<span class="min-w-6 text-base font-medium text-dark dark:text-light">{index}.</span>
			<span class="flex-1 text-base font-medium text-dark dark:text-light">{category}</span>
		</div>
		<div class="relative mb-7 md:mb-0 md:w-7/12 {loading ? 'opacity-60' : ''}">
			<input
				autocomplete="off"
				type="text"
				bind:value={inputValue}
				name="answer-{index}"
				placeholder="{letter.toUpperCase()}..."
				disabled={disabled}
				readonly={locked}
				class="w-full border-b py-2 text-base text-dark transition-colors duration-200 placeholder:text-gray-400 focus:outline-none dark:text-light dark:placeholder:text-light/30 {locked
					? 'cursor-default'
					: ''} {startsWithLetter
					? 'border-green-500 dark:border-green-400/80'
					: inputValue.length > 0
						? 'border-red-600 dark:border-red-400'
						: 'border-gray-300 dark:border-gray-600'}"
			/>
		</div>
	</div>
{/if}
