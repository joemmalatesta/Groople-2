<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import faviconLight from '$lib/assets/favicon-light.svg';

	export let variant: 'editorial' | 'letter' | 'dark' | 'result' | 'bill';
</script>

<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800">
	<div class="flex items-center gap-3 px-4 py-3">
		<span class="h-10 w-10 rounded-full bg-neutral-200"></span>
		<div>
			<p class="text-sm font-medium text-dark">Groople</p>
			<p class="text-xs text-gray-400">@groople</p>
		</div>
	</div>
	<p class="px-4 pb-3 text-sm text-dark">Today's puzzle is up.</p>

	<div class="aspect-[1.91/1] w-full">
		{#if variant === 'editorial'}
			<div class="flex h-full flex-col justify-between bg-light p-6 text-dark">
				<img src={favicon} alt="" class="h-10 w-10" />
				<div>
					<h2 class="m-0 text-5xl leading-none">Groople</h2>
					<p class="mt-3 text-sm text-gray-500">12 categories. 100 seconds. One letter.</p>
				</div>
			</div>
		{:else if variant === 'letter'}
			<div class="flex h-full items-end justify-between bg-light p-6 text-dark">
				<h2 class="m-0 text-8xl leading-none">S</h2>
				<div class="text-right">
					<p class="text-xs uppercase tracking-[0.25em] text-gray-400">Today</p>
					<h3 class="m-0 text-3xl">Groople</h3>
				</div>
			</div>
		{:else if variant === 'dark'}
			<div class="flex h-full flex-col justify-between bg-dark p-6 text-light">
				<img src={faviconLight} alt="" class="h-10 w-10" />
				<div>
					<h2 class="m-0 text-5xl leading-none text-light">Groople</h2>
					<p class="mt-3 text-sm text-gray-400">The daily letter game.</p>
				</div>
			</div>
		{:else if variant === 'result'}
			<div class="flex h-full flex-col justify-between bg-light p-6 text-dark">
				<p class="text-xs uppercase tracking-[0.25em] text-gray-400">Sep 25 · Letter S</p>
				<div>
					<h2 class="m-0 text-7xl leading-none">9<span class="text-4xl text-gray-400">/12</span></h2>
					<p class="mt-2 text-sm tracking-[0.2em]">●●●○●●●●○●●○</p>
				</div>
			</div>
		{:else}
			<div class="grid h-full grid-cols-3 bg-light text-dark">
				<div class="flex flex-col items-center justify-center border-r border-gray-200">
					<p class="text-xs uppercase tracking-widest text-gray-400">Letter</p>
					<h2 class="m-0 text-6xl">S</h2>
				</div>
				<div class="flex flex-col items-center justify-center border-r border-gray-200">
					<p class="text-xs uppercase tracking-widest text-gray-400">Time</p>
					<h2 class="m-0 text-6xl">100</h2>
				</div>
				<div class="flex flex-col items-center justify-center">
					<p class="text-xs uppercase tracking-widest text-gray-400">Categories</p>
					<h2 class="m-0 text-6xl">12</h2>
				</div>
			</div>
		{/if}
	</div>
	<p class="border-t border-gray-200 px-4 py-2 text-xs text-gray-400">groople.com</p>
</div>
