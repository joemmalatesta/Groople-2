<script lang="ts">
	let topLink: SVGGElement;
	let bottomLink: SVGGElement;
	let playing = false;

	export function play() {
		if (playing) {
			return;
		}
		playing = true;

		const options: KeyframeAnimationOptions = {
			duration: 700,
			easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)'
		};
		const first = topLink.animate(keyframes(1), options);
		bottomLink.animate(keyframes(-1), options);
		first.onfinish = () => {
			playing = false;
		};
	}

	function keyframes(direction: 1 | -1): Keyframe[] {
		const meet = `translate(${direction * 30}px, ${direction * -30}px) rotate(${direction * 12}deg)`;
		const bounce = `translate(${direction * -11}px, ${direction * 11}px) rotate(0deg)`;
		return [
			{ transform: 'translate(0px, 0px) rotate(0deg)' },
			{ transform: meet, offset: 0.42 },
			{ transform: bounce, offset: 0.72 },
			{ transform: 'translate(0px, 0px) rotate(0deg)' }
		];
	}
</script>

<span class="inline-flex text-dark dark:text-light">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 256 256"
		class="h-9 w-9 origin-center [transform-box:fill-box]"
		fill="currentColor"
	>
		<path d="M87.5,151.52l64-64a12,12,0,0,1,17,17l-64,64a12,12,0,0,1-17-17Z" />
		<g bind:this={topLink} class="origin-center [transform-box:fill-box]">
			<path
				d="M218.5,37.52a60.08,60.08,0,0,0-84.87,0L103.51,67.61a12,12,0,0,0,17,17l30.07-30.06a36,36,0,0,1,50.93,50.92L171.4,135.52a12,12,0,1,0,17,17l30.08-30.06A60.09,60.09,0,0,0,218.45,37.55Z"
			/>
		</g>
		<g bind:this={bottomLink} class="origin-center [transform-box:fill-box]">
			<path
				d="M135.52,171.4l-30.07,30.08a36,36,0,0,1-50.92-50.93l30.06-30.07a12,12,0,0,0-17-17L37.55,133.58a60,60,0,0,0,84.88,84.87l30.06-30.07a12,12,0,0,0-17-17Z"
			/>
		</g>
	</svg>
</span>
