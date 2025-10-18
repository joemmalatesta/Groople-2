<script lang="ts">
	import { toLowerCase } from 'zod';

	export let index: number;
	export let category: string;
	export let letter: string;
	export let valid: string;
	export let answersSubmitted: boolean;
	export let disabled: boolean;

	let inputValue = '';
	let isValid = false;
	let validationResult: boolean | null = null;

	$: {
		// If we have a validation result, use that
		if (valid === 'yes' || valid === 'no') {
			validationResult = valid === 'yes';
			isValid = validationResult;
		} else if (valid) {
			// Legacy: check if valid prop matches input
			isValid = valid === inputValue.toLowerCase();
		} else if (inputValue.toLowerCase().startsWith(letter.toLowerCase())) {
			// Default: check if input starts with letter
			isValid = true;
		} else {
			isValid = false;
		}
	}
</script>

<div class="flex flex-col justify-between py-1 md:flex-row md:items-center md:gap-4">
	<div class="flex items-center md:gap-2">
		<span class="min-w-6 text-base font-medium text-dark dark:text-light">{index}.</span>
		<span class="flex-1 text-base font-medium text-dark dark:text-light">{category}</span>
	</div>
	<div class="relative mb-7 md:mb-0 md:w-7/12">
		<input
			type="text"
			bind:value={inputValue}
			name="answer-{index}"
			placeholder="{letter.toUpperCase()}..."
			disabled={disabled || answersSubmitted}
			class="w-full border-b border-gray-300 py-2 text-base text-dark transition-colors duration-200 placeholder:text-gray-400 focus:outline-none
			  dark:border-gray-600 dark:text-light dark:placeholder:text-light/50"
		/>
		{#if answersSubmitted && validationResult !== null}
			<div class="absolute top-1/2 right-0 -translate-y-1/2 text-sm font-medium">
				{#if validationResult}
					<span class="text-green-600 dark:text-green-400">✓</span>
				{:else}
					<span class="text-red-600 dark:text-red-400">✗</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
