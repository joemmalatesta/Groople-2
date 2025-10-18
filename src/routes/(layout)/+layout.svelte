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

<div class="bg-app-light dark:bg-app-dark min-h-screen">
	{@render children?.()}
</div>
