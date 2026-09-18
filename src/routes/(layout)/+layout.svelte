<script lang="ts">
	import '../../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { theme, applyTheme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let { children } = $props();
	// mm/dd/yy
	const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

	// Initialize theme on mount
	onMount(() => {
		applyTheme($theme);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Groople - {today}</title>
	<script>
		// Apply theme immediately to prevent flash
		(function () {
			const theme =
				localStorage.getItem('theme') ||
				(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
			if (theme === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		})();
	</script>
</svelte:head>

<div class="min-h-screen bg-light text-dark dark:bg-dark dark:text-light">
	{@render children?.()}
	<footer class="mb-3 flex justify-center">
		<h4 class="font-inter! text-sm">
			Created by
			<a
				href="https://joemmalatesta.com"
				class="underline underline-offset-2 transition-all hover:underline-offset-4"
				>Joe Malatesta</a
			>
		</h4>
	</footer>
</div>
