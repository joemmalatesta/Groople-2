<script lang="ts">
	export let index: number;
	export let category: string;
	export let letter: string;
	export let valid: string;
	export let answersSubmitted: boolean;
	export let disabled: boolean;
	export let loading: boolean;
	export let recordedAnswer: string = '';

	let inputValue = '';

	$: displayAnswer = recordedAnswer.trim().length > 0 ? recordedAnswer.trim() : 'Unanswered';
	$: isCorrect = valid === 'yes';
	$: startsWithLetter = inputValue.toLowerCase().startsWith(letter.toLowerCase());
</script>

<div class="flex flex-col justify-between py-1 md:flex-row md:items-center md:gap-4">
	<div class="flex items-center md:gap-2">
		<span class="min-w-6 text-base font-medium text-dark dark:text-light">{index}.</span>
		<span class="flex-1 text-base font-medium text-dark dark:text-light">{category}</span>
	</div>
	<div class="relative mb-7 md:mb-0 md:w-7/12 {loading ? 'opacity-60' : ''}">
		{#if answersSubmitted}
			<p class="flex w-full items-center justify-between border-b border-gray-300 py-2 text-base text-dark dark:border-gray-600 dark:text-light">
				<span class="underline">{displayAnswer}</span>
				{#if isCorrect}
					<span class="text-green-600 dark:text-green-400">✓</span>
				{:else}
					<span class="text-red-600 dark:text-red-400">✗</span>
				{/if}
			</p>
		{:else}
			<input
				autocomplete="off"
				type="text"
				bind:value={inputValue}
				name="answer-{index}"
				placeholder="{letter.toUpperCase()}..."
				disabled={disabled}
				class="w-full border-b py-2 text-base text-dark transition-colors duration-200 placeholder:text-gray-400 focus:outline-none dark:text-light dark:placeholder:text-light/30 {startsWithLetter
					? 'border-green-500 dark:border-green-400/80'
					: inputValue.length > 0
						? 'border-red-600 dark:border-red-400'
						: 'border-gray-300 dark:border-gray-600'}"
			/>
		{/if}
	</div>
</div>
