<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LoadingBoards from '$lib/components/preview/LoadingBoards.svelte';
	import ShareBoards from '$lib/components/preview/ShareBoards.svelte';
	import LinkCards from '$lib/components/preview/LinkCards.svelte';
	import { sampleResult, shareText } from '$lib/preview/shareCopy';
	import favicon from '$lib/assets/favicon.svg';

	const marks = [
		{ emoji: '📋', title: 'Clipboard', note: 'The plain “this copies” mark. Closest to a copy button.' },
		{ emoji: '📤', title: 'Outbox', note: 'The tray-and-arrow people already tap to share on a phone.' },
		{ emoji: '🔗', title: 'Link', note: 'Says the thing you’re handing over is the Groople link.' },
		{ emoji: '↗️', title: 'Arrow', note: 'The same gesture as a system share button, without a box around it.' },
		{ emoji: '📎', title: 'Paperclip', note: 'Reads as attaching the result to a post.' }
	];
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
		Row skeleton is the loading state. The share copy is still the filled and open dots. The third tile is only the button, shown here with five marks. The link card is the light editorial lockup with today’s letter on the right.
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
			Same tile, same copied result. The mark is the only difference. Sample round: letter {sampleResult.letter}, {sampleResult.correct.filter(Boolean).length} right.
		</p>
		<pre class="mt-4 max-w-md overflow-x-auto rounded-2xl bg-neutral-200 p-5 text-sm whitespace-pre-wrap text-dark dark:bg-neutral-800 dark:text-light">{shareText('dots', sampleResult)}</pre>
		<div class="mt-8 grid gap-8 md:grid-cols-2">
			{#each marks as option, index}
				<article>
					<h3 class="text-2xl text-dark dark:text-light">{index + 1}. {option.emoji} {option.title}</h3>
					<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{option.note}</p>
					<div class="mt-4 max-w-md">
						<ShareBoards mark={option.emoji} />
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section id="link" class="mt-20 scroll-mt-20">
		<h2 class="text-3xl text-dark dark:text-light">The link</h2>
		<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
			Light field. The mark, the name, and the one-line rules stay on the left. Today’s letter sits large on the right. The shared address is still just groople.com, so every post unfurls this same card, with the letter swapped each day.
		</p>
		<div class="mt-6 max-w-xl">
			<LinkCards />
		</div>
	</section>
</main>
