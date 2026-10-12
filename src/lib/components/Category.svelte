<script lang="ts">
	import { fade } from 'svelte/transition';
	import ArrowClockwise from 'phosphor-svelte/lib/ArrowClockwise';

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
	export let canRebuttal = false;
	export let rebuttalSent = false;
	export let rebuttalBusy = false;
	export let rebuttalOpen = true;
	export let rebuttalYes = 0;
	export let rebuttalNo = 0;
	export let onRebuttal: () => Promise<boolean> | boolean = () => false;

	let inputValue = initialValue;

	$: hasAnswer = recordedAnswer.trim().length > 0;
	$: displayAnswer = hasAnswer ? recordedAnswer.trim() : 'Unanswered';
	$: isCorrect = valid === 'yes';
	$: startsWithLetter = inputValue.toLowerCase().startsWith(letter.toLowerCase());
	$: fadeDelay = (index - 1) * 50;
	$: rowClass = isCorrect ? 'rounded-md bg-neutral-200 dark:bg-neutral-800' : '';
	$: textClass = isCorrect ? '' : 'opacity-45';

	async function send() {
		if (rebuttalSent || rebuttalBusy || !rebuttalOpen) {
			return;
		}
		await onRebuttal();
	}
</script>

{#if answersSubmitted}
	<div class="mb-1.5 flex items-center gap-3 px-3 py-2 {rowClass}">
		<div class="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-4">
			<div class="flex min-w-0 items-baseline gap-2 md:flex-1 {textClass}">
				<span class="min-w-6 shrink-0 text-base font-medium text-dark dark:text-light">{index}.</span>
				<span class="text-base font-medium wrap-break-word text-dark dark:text-light">{category}</span
				>
			</div>
			<div class="min-w-0 flex-1 pl-8 md:pl-0">
				{#if reveal}
					<p
						class="text-base text-dark wrap-break-word dark:text-light {textClass} {hasAnswer
							? ''
							: 'italic'}"
						in:fade={{ delay: fadeDelay, duration: 280 }}
					>
						{displayAnswer}
					</p>
				{:else}
					<p
						class="text-base text-dark wrap-break-word dark:text-light {textClass} {hasAnswer
							? ''
							: 'italic'}"
					>
						{displayAnswer}
					</p>
				{/if}
			</div>
		</div>
		{#if canRebuttal && rebuttalSent}
			<span
				class="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-gray-500 tabular-nums dark:text-gray-300"
				aria-label="{rebuttalYes} yes, {rebuttalNo} no"
			>
				<span class="inline-flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
					{rebuttalYes}
				</span>
				<span class="inline-flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
					{rebuttalNo}
				</span>
			</span>
		{:else if canRebuttal && rebuttalOpen}
			<button
				type="button"
				class="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-dark/20 px-2.5 py-0.5 text-xs font-medium text-dark transition-colors hover:bg-dark/5 disabled:cursor-default disabled:opacity-50 dark:border-light/25 dark:text-light dark:hover:bg-light/10"
				disabled={rebuttalBusy}
				on:click={send}
			>
				Rebuttal
				<ArrowClockwise
					size={14}
					weight="bold"
					class="transition-transform duration-500 ease-out {rebuttalBusy ? 'rotate-180' : ''}"
				/>
			</button>
		{/if}
	</div>
{:else}
	<div class="flex flex-col justify-between py-1 md:flex-row md:items-center md:gap-4">
		<div class="flex items-center md:gap-2">
			<span class="min-w-6 text-base font-medium text-dark dark:text-light">{index}.</span>
			<span class="flex-1 text-base font-medium wrap-break-word text-dark dark:text-light"
				>{category}</span
			>
		</div>
		<div class="relative mb-7 md:mb-0 md:w-7/12 {loading ? 'opacity-60' : ''}">
			<input
				autocomplete="off"
				type="text"
				bind:value={inputValue}
				name="answer-{index}"
				placeholder="{letter.toUpperCase()}..."
				{disabled}
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
