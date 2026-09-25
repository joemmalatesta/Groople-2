<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { sampleResult } from '$lib/preview/shareCopy';
</script>

<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
	<div class="flex items-center gap-3 px-4 py-3">
		<span class="h-10 w-10 rounded-full bg-neutral-200"></span>
		<div>
			<p class="text-sm font-medium text-dark">Groople</p>
			<p class="text-xs text-gray-400">@groople</p>
		</div>
	</div>
	<p class="px-4 pb-3 text-sm text-dark">Today's puzzle is up.</p>

	<div class="aspect-[1.91/1] w-full">
		<div class="flex h-full flex-col justify-between bg-light p-6 text-dark">
			<img src={favicon} alt="" class="h-10 w-10" />
			<div>
				<div class="flex items-end justify-between gap-6">
					<h2 class="m-0 text-5xl leading-none">Groople</h2>
					<h2 class="m-0 text-8xl leading-none md:text-9xl">{sampleResult.letter}</h2>
				</div>
				<p class="mt-3 max-w-xs text-sm text-gray-500">12 categories. 100 seconds. One letter.</p>
			</div>
		</div>
	</div>
	<p class="border-t border-gray-200 px-4 py-2 text-xs text-gray-400">groople.xyz</p>
</div>
