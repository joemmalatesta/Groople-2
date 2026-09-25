<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LoadingBoards from '$lib/components/preview/LoadingBoards.svelte';
	import ShareBoards from '$lib/components/preview/ShareBoards.svelte';
	import LinkCards from '$lib/components/preview/LinkCards.svelte';
	import { sampleResult, shareText } from '$lib/preview/shareCopy';
	import favicon from '$lib/assets/favicon.svg';
	import LinkSimple from 'phosphor-svelte/lib/LinkSimple';
</script>

<svelte:head>
	<title>Launch options</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
	<div class="sticky top-0 z-10 flex items-center justify-between bg-light/80 py-4 backdrop-blur-sm dark:bg-dark/80">
		<a href="/" class="flex items-center gap-2 text-dark dark:text-light">
			<img src={favicon} alt="" class="h-8 w-8 dark:invert" />
			<span class="text-sm">Groople</span>
		</a>
		<nav class="flex gap-4 text-sm">
			<a href="#loading" class="text-gray-500 hover:text-dark dark:hover:text-light">Loading</a>
			<a href="#share" class="text-gray-500 hover:text-dark dark:hover:text-light">Share</a>
			<a href="#link" class="text-gray-500 hover:text-dark dark:hover:text-light">Link</a>
		</nav>
		<ThemeToggle />
	</div>

	<h1 class="mt-8 text-4xl text-dark dark:text-light">Picks</h1>
	<p class="mt-3 max-w-2xl text-base text-gray-500 dark:text-gray-400">
		Row skeleton is the loading state. The share tile uses the link icon and copies the filled and open dots. The link card keeps the light lockup, with today’s letter on the bottom edge.
	</p>

	<section id="loading" class="mt-14 scroll-mt-20">
		<h2 class="text-3xl text-dark dark:text-light">Loading</h2>
		<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
			Left is the board arriving. Right is the gap between Submit and the answer reveal.
		</p>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			<div class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
				<p class="mb-3 text-xs uppercase tracking-widest text-gray-400">Opening</p>
				<LoadingBoards variant="rows" moment="open" />
			</div>
			<div class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
				<p class="mb-3 text-xs uppercase tracking-widest text-gray-400">Scoring</p>
				<LoadingBoards variant="rows" moment="score" />
			</div>
		</div>
	</section>

	<section id="share" class="mt-20 scroll-mt-20">
		<h2 class="text-3xl text-dark dark:text-light">Share button</h2>
		<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
			The link icon. It copies the dot row. Sample round: letter {sampleResult.letter}, {sampleResult.correct.filter(Boolean).length} right.
		</p>
		<div class="mt-4 grid items-start gap-4 lg:grid-cols-2">
			<div class="max-w-md">
				<ShareBoards icon={LinkSimple} />
			</div>
			<pre class="overflow-x-auto rounded-2xl bg-neutral-200 p-5 text-sm whitespace-pre-wrap text-dark dark:bg-neutral-800 dark:text-light">{shareText('dots', sampleResult)}</pre>
		</div>
	</section>

	<section id="link" class="mt-20 scroll-mt-20">
		<h2 class="text-3xl text-dark dark:text-light">The link</h2>
		<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
			Light field. The mark, the name, and the one-line rules stay on the left. Today’s letter sits on the bottom edge, level with the last line. The shared address is still just groople.xyz, so every post unfurls this same card, with the letter swapped each day.
		</p>
		<div class="mt-6 max-w-xl">
			<LinkCards />
		</div>
	</section>
</main>
