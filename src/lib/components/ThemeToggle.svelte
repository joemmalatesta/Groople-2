<script lang="ts">
	import { onMount } from 'svelte';
	import { theme, toggleTheme } from '$lib/stores/theme';
	import Sun from 'phosphor-svelte/lib/Sun';
	import Moon from 'phosphor-svelte/lib/Moon';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});
</script>

<button
	onclick={toggleTheme}
	class="bg-app-light/50 hover:bg-app-light/70 dark:bg-app-dark/50 dark:hover:bg-app-dark/70 rounded-lg p-2 transition-colors duration-200"
	aria-label="Toggle theme"
	title="Toggle theme"
>
	{#if mounted}
		{#if $theme === 'light'}
			<svelte:component
				this={Moon}
				size={20}
				weight="fill"
				class="text-app-dark/80 dark:text-app-light/80"
			/>
		{:else}
			<svelte:component
				this={Sun}
				size={20}
				weight="fill"
				class="text-app-dark/80 dark:text-app-light/80"
			/>
		{/if}
	{/if}
</button>
