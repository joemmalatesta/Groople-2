<script lang="ts">
	import { toLowerCase } from "zod";

	export let index: number;
	export let category: string;
	export let letter: string;
	export let valid: string;
	export let answersSubmitted: boolean;
	export let disabled: boolean;

	let inputValue = '';
	let isValid = false;

	$: {
		// Use the valid prop if provided, otherwise check if input starts with letter
		if (valid) {
			isValid = valid === inputValue.toLowerCase();
		} else if (inputValue.toLowerCase().startsWith(letter.toLowerCase())) {
			isValid = true;
		} else {
			isValid = false;
		}
	}
</script>

<div class="flex items-center gap-4 py-3">
	<span class="text-app-dark dark:text-app-light min-w-6 text-base font-medium">{index}.</span>
	<span class="text-app-dark dark:text-app-light flex-1 text-base font-medium">{category}</span>
	<input
		type="text"
		bind:value={inputValue}
		placeholder={letter.toUpperCase()}...
		disabled={disabled || answersSubmitted} 
		class="text-app-dark dark:text-app-light w-48 border-0 border-b-2 border-gray-300 bg-transparent py-2 text-base transition-colors duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:placeholder:text-gray-500 dark:focus:border-blue-400 {inputValue && inputValue[0].toLowerCase() == letter.toLowerCase() 
			? 'border-green-500 dark:border-green-400'
			: inputValue
				? 'border-red-500 dark:border-red-400'
				: ''} {disabled || answersSubmitted ? 'cursor-not-allowed opacity-60' : ''}"
	/>
</div>
