<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LoadingBoards from '$lib/components/preview/LoadingBoards.svelte';
	import ShareBoards from '$lib/components/preview/ShareBoards.svelte';
	import LinkCards from '$lib/components/preview/LinkCards.svelte';
	import { sampleResult, shareText, type ShareOptionId } from '$lib/preview/shareCopy';
	import favicon from '$lib/assets/favicon.svg';

	const loading = [
		{
			id: 'rows' as const,
			title: 'Row skeleton',
			note: 'Twelve pulsing rows in the shape of the board. Opening hides the categories. Scoring hides the answers in the same bars until they lock in.'
		},
		{
			id: 'header' as const,
			title: 'Letter first',
			note: 'The letter and the clock appear as blocks before the rows. Scoring uses the same blocks, so the wait feels like the board is still assembling.'
		},
		{
			id: 'lines' as const,
			title: 'Underline',
			note: 'Matches the input rules: a short label and a line, no filled boxes. While scoring, the line under each answer pulses and the words stay put.'
		},
		{
			id: 'scan' as const,
			title: 'Scan',
			note: 'Opening is a quiet row skeleton. Scoring keeps what you typed and washes a pulse across each row, with a thin bar under the header for the wait.'
		},
		{
			id: 'sheet' as const,
			title: 'Sheet',
			note: 'The whole board sits in one card, letter and time included. Scoring replaces every row with a lock-in bar so the reveal has somewhere to land.'
		}
	];

	const shares: { id: ShareOptionId; title: string; note: string }[] = [
		{
			id: 'dots',
			title: 'Dot row',
			note: 'The third tile is the twelve dots. Filled means right. The copy leads with the date, the score, and the letter.'
		},
		{
			id: 'letter',
			title: 'Today’s letter',
			note: 'The tile shows the day’s letter, the thing people recognize. The copy is three short lines: the letter, the score, the link.'
		},
		{
			id: 'sentence',
			title: 'Sentence',
			note: 'A share icon in the percentile slot. The copy is one sentence someone can post without looking like a puzzle grid.'
		},
		{
			id: 'line',
			title: 'Score line',
			note: 'The tile reads 9/12, score and how many were right in one glance. The copy is a single sports line plus the link.'
		},
		{
			id: 'receipt',
			title: 'Missed',
			note: 'The tile counts what you missed, which is the interesting number when the score is already on the left. The copy is a short receipt.'
		}
	];

	const links = [
		{
			id: 'editorial' as const,
			title: 'Editorial',
			note: 'Light field, the mark, and the one-line rules. This is the card for a clean homepage link. Every share of groople.com looks the same.'
		},
		{
			id: 'letter' as const,
			title: 'Giant letter',
			note: 'The day’s letter fills the card, the way it fills the game. It needs a new image each day, still on the same clean URL.'
		},
		{
			id: 'dark' as const,
			title: 'Dark',
			note: 'The same editorial card inverted. It holds up in a light timeline and matches the dark game.'
		},
		{
			id: 'result' as const,
			title: 'Your score',
			note: 'The card carries 9/12 and the dots. That only works if each result has its own image URL, so the link stops being just groople.com.'
		},
		{
			id: 'bill' as const,
			title: 'Play bill',
			note: 'Letter, time, and category count, in the same three-part header as the game. A brand card, not a personal one, so the shared link stays clean.'
		}
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

	<h1 class="mt-8 text-4xl text-dark dark:text-light">Five ways each</h1>
	<p class="mt-3 max-w-2xl text-base text-gray-500 dark:text-gray-400">
		Nothing here is wired into the game yet. Loading covers opening the puzzle and the wait after submit.
		Share replaces the percentile tile. The link cards are what X and iMessage show when someone posts groople.com.
	</p>

	<section id="loading" class="mt-14 scroll-mt-20">
		<h2 class="text-3xl text-dark dark:text-light">Loading</h2>
		<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
			Left is the board arriving. Right is the gap between Submit and the answer reveal.
		</p>
		<div class="mt-8 flex flex-col gap-12">
			{#each loading as option, index}
				<article>
					<h3 class="text-2xl text-dark dark:text-light">{index + 1}. {option.title}</h3>
					<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{option.note}</p>
					<div class="mt-4 grid gap-4 md:grid-cols-2">
						<div class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
							<p class="mb-3 text-xs uppercase tracking-widest text-gray-400">Opening</p>
							<LoadingBoards variant={option.id} moment="open" />
						</div>
						<div class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
							<p class="mb-3 text-xs uppercase tracking-widest text-gray-400">Scoring</p>
							<LoadingBoards variant={option.id} moment="score" />
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section id="share" class="mt-20 scroll-mt-20">
		<h2 class="text-3xl text-dark dark:text-light">Share</h2>
		<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
			The percentile column becomes the share control. Sample round: letter {sampleResult.letter}, {sampleResult.correct.filter(Boolean).length} right, streak {sampleResult.streak}. Tapping copies the text on the right.
		</p>
		<div class="mt-8 flex flex-col gap-12">
			{#each shares as option, index}
				<article class="grid items-start gap-4 lg:grid-cols-2">
					<div>
						<h3 class="text-2xl text-dark dark:text-light">{index + 1}. {option.title}</h3>
						<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{option.note}</p>
						<div class="mt-4 max-w-md">
							<ShareBoards variant={option.id} />
						</div>
					</div>
					<pre class="mt-10 overflow-x-auto rounded-2xl bg-neutral-200 p-5 text-sm whitespace-pre-wrap text-dark dark:bg-neutral-800 dark:text-light">{shareText(option.id, sampleResult)}</pre>
				</article>
			{/each}
		</div>
	</section>

	<section id="link" class="mt-20 scroll-mt-20">
		<h2 class="text-3xl text-dark dark:text-light">The link</h2>
		<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
			A clean link is just the site. X turns it into the large box when the page has a title, a description, and a 1200×630 image, with the card type set to summary_large_image. The score stays in the copied text. Putting the score on the image means a different image for every result, and the link is no longer one address.
		</p>
		<div class="mt-8 flex flex-col gap-12">
			{#each links as option, index}
				<article>
					<h3 class="text-2xl text-dark dark:text-light">{index + 1}. {option.title}</h3>
					<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{option.note}</p>
					<div class="mt-4 max-w-xl">
						<LinkCards variant={option.id} />
					</div>
				</article>
			{/each}
		</div>
	</section>
</main>
