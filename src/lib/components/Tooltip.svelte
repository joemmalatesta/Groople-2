<script lang="ts">
	export let text: string;
	export let align: 'center' | 'start' | 'end' = 'center';
	export let side: 'top' | 'bottom' = 'top';
	export let full = false;
</script>

<span class="group relative inline-flex {full ? 'h-full min-w-0 w-full flex-1' : ''}">
	<slot />
	<span
		role="tooltip"
		class="pointer-events-none absolute z-20 w-max rounded-md bg-dark px-2 py-1 text-center text-xs text-light opacity-0 shadow-lg transition-opacity delay-0 duration-0 group-hover:opacity-100 group-hover:delay-500 {side ===
		'top'
			? 'bottom-full mb-2'
			: 'top-full mt-2'} {align === 'center'
			? 'left-1/2 -translate-x-1/2'
			: align === 'end'
				? 'right-0'
				: 'left-0'}"
	>
		{text}
	</span>
</span>
