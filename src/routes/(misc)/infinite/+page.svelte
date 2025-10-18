<script lang="ts">
	import { fly, slide, fade, blur, crossfade } from 'svelte/transition';
	import { CATEGORIES } from '$lib/constants';
	let screenWidth: number;
	let categoryTextSize: string;
	let categoryTextSizeIndicator: number;
	let categorySizeKey: { [key: number]: string } = {
		0: '.875rem',
		1: '.875rem',
		2: '1rem',
		3: '1.125rem',
		4: '1.25rem',
		5: '1.5rem',
		6: '1.875rem',
		7: '2.25rem'
	};

	$: setSize(screenWidth);

	function setSize(screenWidth: number) {
		if (screenWidth > 1535) {
			categoryTextSizeIndicator = 6;
		} else if (1535 >= screenWidth && screenWidth > 1280) {
			categoryTextSizeIndicator = 5;
		} else if (1280 >= screenWidth && screenWidth > 1024) {
			categoryTextSizeIndicator = 4;
		} else if (1024 >= screenWidth && screenWidth > 768) {
			categoryTextSizeIndicator = 3;
		} else if (768 >= screenWidth && screenWidth > 640) {
			categoryTextSizeIndicator = 2;
		} else {
			categoryTextSizeIndicator = 1;
		}
	}

	$: categoryTextSize = categorySizeKey[categoryTextSizeIndicator];

	//Make python sleep because idk how setTimeout works
	const sleep = (milliseconds: number) => {
		return new Promise((resolve) => setTimeout(resolve, milliseconds));
	};

	//Initialize all Categories and Hover Elements

	let pauseHovered = false;
	let refreshHovered = false;

	// CHOOSE OR REFRESH LETTER
	let letter: string = randomLetter();
	function randomLetter() {
		//Only scattergories letters
		const characters = 'abcdefghijklmnoprstw';
		return characters.charAt(Math.floor(Math.random() * characters.length)).toUpperCase();
	}

	//   CHOOSE CATEGORIES
	//  empty and choose 12 new categories each time refresh is run.
	//  Remove selected categories from the big list so that they're not reused.
	let possibleCategories: string[] = CATEGORIES;
	let categories: string[] = refreshCategories();
	function refreshCategories() {
		//Refresh the letter as well on list refresh
		letter = randomLetter();
		let selectedCategories = [];
		for (let i = 0; i < 12; i++) {
			const randomIndex = Math.floor(Math.random() * possibleCategories.length);
			const selectedCategory = possibleCategories[randomIndex];
			possibleCategories.splice(randomIndex, 1);
			selectedCategories.push(selectedCategory);
		}
		return selectedCategories;
	}

	//SET AND COUNT DOWN TIMER...
	//Should probably make this pause on leaving the page but it should be fine
	//Number always resets back to time entered by user (resetTo)
	//StartTimer and pause timer do exactly that and are called by the later "$:" statement

	let resetTo = 120; //Bound to value of change time
	let time = resetTo;
	let interval: any;
	let alertTime = false;
	function startTimer() {
		paused = false;
		interval = setInterval(function () {
			//If out of time, run animate saying "Time's up."
			//AlertTime is used because text needs to be replaced before the second animateRefresh call for actual refreshing
			if (time === 0) {
				clearInterval(interval);
				alertTime = true;
				animateRefresh(true);
			} else {
				time--;
			}
		}, 1000);
	}

	function stopTimer() {
		clearInterval(interval);
		paused = true;
	}

	//Used for changing the time. ChangeTimeSelected to handle clicks that aren't confirm.
	let changeTimeSelected = false;
	function confirmTimeClicked() {
		if (resetTo > 1000 || resetTo <= 0) {
			resetTo = 120;
		}
		time = resetTo;
		changeTimeSelected = false;
	}

	// Set text and Icon for pause/play box depending on the paused state
	let playPause: string, pausedIcon: string;
	let paused = true;
	$: if (!paused) {
		startTimer();
		playPause = 'Pause';
		pausedIcon = '/pause.png';
	} else {
		stopTimer();
		playPause = 'Play';
		pausedIcon = '/play.png';
	}

	// Animate Refresh. Either for resetting or when the time runs out.
	let showReset = false; //Covers the background completely
	let spinRefresh = false; //Animate the spinny image and accompanying text
	async function animateRefresh(timesUp = false) {
		if (timesUp) {
			showReset = true; //Swipe in
			await sleep(2000); //Let layer stay longer when time is up
			showReset = false; // Swipe out
			alertTime = false;
			return;
		}
		//Spin and wait a sec, then swipe in and out with a one second delay
		spinRefresh = true;
		await sleep(200);
		showReset = true;
		await sleep(1000);
		showReset = false;
		spinRefresh = false;
	}
</script>

<!-- TODO: make this a PWA as well, that would be cool -->
<svelte:head>
	<title>Scattergories List</title>
</svelte:head>

<!-- This shit is all over the place and I hope to make improvements but it looks and works really good :D -->
<!-- Really shouldn't be in one file, but really why not? -->
<!-- TODO: Make this responsive. -->

<!-- Whole thing is just a big ole grid. LARGE SCREEN SIZE-->
<div class="hidden h-[97vh] scale-95 font-serif text-[#222222] lg:flex">
	<!-- FIRST COLUMN -->
	<div class="flex h-full w-[40%] flex-col xl:w-[30%]">
		<!-- Top Half, just the letter. Reroll function is pretty simple -->
		<div
			class="stripes relative flex h-1/2 items-center justify-center border-4 border-b-0 border-neutral-900"
		>
			<div class="absolute top-0 flex w-full justify-between">
				<p class="left-0 mx-3 my-1 text-2xl">Letter</p>
				<button
					class="text-2xl text-neutral-900/70 hover:text-neutral-900/90 {!paused
						? 'opacity-0'
						: 'opacity-100'} right-0 mx-3 my-1 transition-all"
					on:click={() => {
						letter = randomLetter();
					}}>Re-roll</button
				>
			</div>
			<h1 class="font-sans text-[18rem] font-semibold">{letter}</h1>
		</div>

		<!-- Bottom Half, time and pause/play. A lot happening here so read more in depth -->
		<div class="flex h-1/2">
			<!-- Time. Shows time and allows for changing time. When time is changed, it is saved to be used in future rounds. -->
			<div
				class="relative flex w-1/2 items-center justify-center border-4 border-r-0 border-neutral-900"
			>
				<div class="absolute top-0 flex w-full justify-between">
					<p class="left-0 mx-3 my-1 text-2xl">Time</p>
					<button
						class="left-0 mx-3 my-1 text-2xl text-neutral-900/70 transition-all hover:text-neutral-900/90"
						on:click={() => {
							paused = true;
							if (changeTimeSelected) {
								confirmTimeClicked();
							} else {
								changeTimeSelected = true;
							}
						}}>Change</button
					>
				</div>

				<!-- When change is selected, open an editor of sorts. Clicking confirm, change again, or pressing play are all valid escapes -->
				{#if changeTimeSelected}
					<form class="flex flex-col items-center justify-center">
						<input
							class="h-10 w-44 border-2 border-b-0 border-neutral-800 text-3xl"
							type="text"
							pattern="[0-9]+"
							inputmode="numeric"
							placeholder={`${time - 1}`}
							bind:value={resetTo}
						/>
						<button
							class="h-8 w-full bg-neutral-800 text-white hover:bg-neutral-900"
							on:click={confirmTimeClicked}>Confirm</button
						>
					</form>
				{:else}
					<h1 class="text-8xl">{time}</h1>
				{/if}
			</div>

			<!-- PLAY / PAUSE -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="relative flex w-1/2 items-center justify-center border-4 border-neutral-900 {pauseHovered
					? 'dots'
					: ''}"
				on:mouseenter={() => {
					pauseHovered = true;
				}}
				on:mouseleave={() => {
					pauseHovered = false;
				}}
			>
				<!-- Key makes it so that each time paused changes, the animations are reset. Most of this stuff is handled in the script portion though-->
				{#key paused}
					<div class="absolute top-0 flex w-full">
						<p
							class="mx-3 my-1 text-2xl"
							transition:fly|global={{ delay: 100, duration: 400, y: 20 }}
						>
							{playPause}
						</p>
					</div>
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<img
						src="infinite/{pausedIcon}"
						alt="{playPause} Game"
						class="{paused ? 'w-56' : 'w-40'} absolute cursor-pointer"
						in:fly|global={{ delay: 100, x: -20 }}
						out:fly|global={{ duration: 100, x: 20 }}
						on:click={() => {
							if (changeTimeSelected) {
								confirmTimeClicked();
							}
							paused = !paused;
						}}
						on:keypress={() => {
							if (changeTimeSelected) {
								confirmTimeClicked();
							}
							paused = !paused;
						}}
					/>
				{/key}
			</div>
		</div>
	</div>
	<!-------------------------------------------------- End first column -->

	<!-- SECOND COLUMN -->
	<div
		class="flex h-full w-[45%] flex-col overflow-auto border-t-4 border-r-4 border-b-4 border-neutral-900 font-sans xl:w-[55%]"
	>
		<!-- Categories Heading -->
		<!-- At some point, if it makes sense, have option to add category or increase number of categories -->
		<div class="flex h-[6%] w-full items-center justify-between border-b-4 border-neutral-900 py-5">
			<h1 class="m-2 text-2xl font-semibold">Categories</h1>
			<div class="font-semibold">
				<button
					class="text-4xl"
					on:click={() => {
						if (categoryTextSizeIndicator == 1) {
							return;
						} else {
							categoryTextSizeIndicator--;
						}
					}}>-</button
				><span style="font-size: {categoryTextSize};" class="w-10">{letter}</span><button
					class="text-4xl"
					on:click={() => {
						if (categoryTextSizeIndicator == 7) {
							return;
						} else {
							categoryTextSizeIndicator++;
						}
					}}>+</button
				>
			</div>
		</div>

		<!-- List of Categories -->
		<!-- Categories can run and will be replaced with "Out of categories" -->
		<ol class="flex h-full w-full flex-col p-2" transition:slide|global>
			{#each categories as category, index}
				<li
					class="relative w-fit border-b py-2 lg:font-semibold"
					style="font-size: {categorySizeKey[categoryTextSizeIndicator - 1]};"
				>
					{index + 1}
					<span class="mx-4" style="font-size: {categoryTextSize};"
						>{category ? category : 'Out of categories'}</span
					>
					{#if paused}
						<div
							class="absolute inset-0 bg-[#222222]"
							in:slide|global={{ delay: index * 40 }}
							out:slide|global
						></div>
					{/if}
				</li>
			{/each}
		</ol>
	</div>
	<!--------------------- End Second Column -->

	<!-- THIRD COLUMN, RESET -->
	<!-- Pretty straight forward here. -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="flex h-full w-[15%] cursor-pointer items-center justify-center border-4 border-l-0 border-neutral-900 {refreshHovered
			? 'dots'
			: ''}"
		on:mouseenter={() => {
			refreshHovered = true;
		}}
		on:mouseleave={() => {
			refreshHovered = false;
		}}
		on:click={() => {
			animateRefresh();
			// Break in between to allow screen to be covered before changing UI
			setTimeout(() => {
				categories = refreshCategories();
				time = resetTo;
				paused = true;
			}, 600);
		}}
		on:keypress={() => {
			animateRefresh();
			setTimeout(() => {
				categories = refreshCategories();
				time = resetTo;
				paused = true;
			}, 600);
		}}
	>
		<!-- Refresh Spins and Words Drop down. -->
		<div class="flex flex-col items-center justify-center">
			<img
				src="infinite/refresh.png"
				alt="Refresh List"
				class="w-20 transition-all duration-300 {time === 0 ? 'animate-bounce' : ''} {spinRefresh
					? 'rotate-180 opacity-0'
					: 'rotate-0 opacity-100'}"
			/>
			<h4
				class="my-5 text-3xl {spinRefresh
					? 'translate-y-4 opacity-0'
					: 'translate-y-0 opacity-100'} transition-all duration-300"
			>
				New List
			</h4>
		</div>
	</div>
	<!-------- End Third Column ------------->

	<!-- TIMES UP and RESETTING overlay. Swipe in and out! -->
	{#if showReset}
		<div
			class="opactiy-100 absolute inset-0 flex w-full items-center justify-center bg-[#222222]"
			transition:slide|global={{ duration: 400, axis: 'x' }}
		>
			<h1 class="text-9xl font-bold text-white">{alertTime ? "Time's Up" : 'Restarting...'}</h1>
		</div>
	{/if}
	<!----------End Swipe Overlay----------->
</div>

<!-- MD SCREEN SIZES -->
<div class="flex h-screen font-sans text-[#222222] lg:hidden">
	<!-- FIRST COLUMN : Letter, time, and play/pause -->
	<div class="flex h-full w-1/3 flex-col border-r-4 border-l-4 border-neutral-800 font-serif">
		<!-- LETTER -->
		<div
			class="stripes relative flex h-1/3 w-full items-center justify-center border-b-4 border-neutral-800"
		>
			<div class="absolute top-0 flex w-full justify-between">
				<p class="left-0 mx-1 my-1 sm:mx-3 sm:text-lg md:text-2xl">Letter</p>
				<button
					class="text-neutral-900/70 hover:text-neutral-900/90 sm:text-lg md:text-2xl {!paused
						? 'opacity-0'
						: 'opacity-100'} right-0 mx-1 my-1 transition-all sm:mx-3"
					on:click={() => {
						letter = randomLetter();
					}}>Re-roll</button
				>
			</div>
			<h1 class="font-sans text-[7rem] font-semibold md:text-[12rem]">{letter}</h1>
		</div>

		<!-- Time -->
		<div
			class="relative flex h-1/3 w-full items-center justify-center border-b-4 border-neutral-800"
		>
			<div class="absolute top-0 flex w-full justify-between">
				<p class="mx-1 my-1 sm:mx-3 sm:text-lg md:text-2xl">Time</p>
				<button
					class="mx-1 my-1 text-neutral-900/70 transition-all hover:text-neutral-900/90 sm:mx-3 sm:text-lg md:text-2xl"
					on:click={() => {
						paused = true;
						if (changeTimeSelected) {
							confirmTimeClicked();
						} else {
							changeTimeSelected = true;
						}
					}}>Change</button
				>
			</div>
			{#if changeTimeSelected}
				<form class="flex flex-col items-center justify-center">
					<input
						class="h-10 w-24 border-2 border-b-0 border-neutral-800 text-3xl sm:w-36 md:w-44"
						type="number"
						placeholder={`${time - 1}`}
						bind:value={resetTo}
					/>
					<button
						class="h-8 w-full bg-neutral-800 text-white hover:bg-neutral-900"
						on:click={confirmTimeClicked}>Confirm</button
					>
				</form>
			{:else}
				<h1 class="text-6xl sm:text-7xl md:text-8xl">{time}</h1>
			{/if}
		</div>

		<!-- Play/Pause -->
		<div class="relative flex h-1/3 w-full items-center justify-center">
			<!-- Key makes it so that each time paused changes, the animations are reset. Most of this stuff is handled in the script portion though-->
			{#key paused}
				<div class="absolute top-0 flex w-full">
					<p
						class="mx-3 my-1 text-2xl"
						transition:fly|global={{ delay: 100, duration: 400, y: 20 }}
					>
						{playPause}
					</p>
				</div>
				<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
				<img
					src="infinite/{pausedIcon}"
					alt="{playPause} Game"
					class="{paused ? 'w-40 md:w-56' : 'w-32 md:w-40'} absolute cursor-pointer"
					in:fly|global={{ delay: 100, x: -20 }}
					out:fly|global={{ duration: 100, x: 20 }}
					on:click={() => {
						if (changeTimeSelected) {
							confirmTimeClicked();
						}
						paused = !paused;
					}}
					on:keypress={() => {
						if (changeTimeSelected) {
							confirmTimeClicked();
						}
						paused = !paused;
					}}
				/>
			{/key}
		</div>
	</div>

	<!-- SECOND COLUMN : categories and refresh -->
	<div class="flex h-full w-2/3 flex-col border-r-4 border-neutral-900">
		<!-- Categories Heading -->
		<div class=" flex h-4/5 w-full flex-col items-center justify-between">
			<div class="flex w-full items-center justify-between border-b-4 border-neutral-900">
				<h1 class="m-2 text-xl font-semibold">Categories</h1>
				<div class="font-semibold">
					<button
						class="text-4xl"
						on:click={() => {
							if (categoryTextSizeIndicator == 1) {
								return;
							} else {
								categoryTextSizeIndicator--;
							}
						}}>-</button
					><span style="font-size: {categoryTextSize};">{letter}</span><button
						class="text-4xl"
						on:click={() => {
							if (categoryTextSizeIndicator == 7) {
								return;
							} else {
								categoryTextSizeIndicator++;
							}
						}}>+</button
					>
				</div>
			</div>

			<!-- List of Categories -->
			<!-- Categories can run and will be replaced with "Out of categories" -->
			<ol class="flex h-full w-full flex-col overflow-auto p-2" transition:slide|global>
				{#each categories as category, index}
					<li
						class="relative w-fit border-b py-1 font-semibold sm:py-2"
						style="font-size:{categorySizeKey[categoryTextSizeIndicator - 1]};"
					>
						{index + 1}
						<span class="mx-4" style="font-size: {categoryTextSize};"
							>{category ? category : 'Out of categories'}</span
						>
						{#if paused}
							<div
								class="absolute inset-0 bg-[#222222]"
								in:slide|global={{ delay: index * 40 }}
								out:slide|global
							/>
						{/if}
					</li>
				{/each}
			</ol>
		</div>

		<!-- REFRESH -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class=" dots flex h-1/5 cursor-pointer items-center justify-center border-t-4 border-neutral-900"
			on:mouseenter={() => {
				refreshHovered = true;
			}}
			on:mouseleave={() => {
				refreshHovered = false;
			}}
			on:click={() => {
				animateRefresh();
				// Break in between to allow screen to be covered before changing UI
				setTimeout(() => {
					categories = refreshCategories();
					time = resetTo;
					paused = true;
				}, 600);
			}}
			on:keypress={() => {
				animateRefresh();
				setTimeout(() => {
					categories = refreshCategories();
					time = resetTo;
					paused = true;
				}, 600);
			}}
		>
			<!-- Refresh Spins and Words Drop down. -->
			<div class="flex flex-col items-center justify-center">
				<img
					src="infinite/refresh.png"
					alt="Refresh List"
					class="w-16 transition-all duration-300 sm:w-20 {time === 0
						? 'animate-bounce'
						: ''} {spinRefresh ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}"
				/>
				<h4
					class="my-2 text-3xl sm:my-5 {spinRefresh
						? 'translate-y-4 opacity-0'
						: 'translate-y-0 opacity-100'} transition-all duration-300"
				>
					New List
				</h4>
			</div>
		</div>
	</div>
	{#if showReset}
		<div
			class="opactiy-100 absolute inset-0 flex w-full items-center justify-center bg-[#222222]"
			transition:slide|global={{ duration: 400, axis: 'x' }}
		>
			<h1 class="text-5xl font-bold text-white sm:text-6xl md:text-8xl">
				{alertTime ? "Time's Up" : 'Restarting...'}
			</h1>
		</div>
	{/if}
</div>
<!--------------END MD SCREEN SIZES -------------->

<!-- Shout out friend :) and me. -->
<div class="mx-4 mb-3 hidden items-center justify-between text-sm lg:mx-12 lg:flex lg:text-xl">
	<p>
		Remake of Swellgarfo's <span
			class="underline underline-offset-2 transition-all hover:underline-offset-4"
			><a href="https://swellgarfo.com/scattergories/">Scattergories List Generator</a></span
		>
	</p>
	<p>
		Made by <span class="underline underline-offset-2 transition-all hover:underline-offset-4"
			><a href="https://github.com/yourusername">Your Name</a></span
		>
	</p>
</div>

<svelte:window bind:innerWidth={screenWidth} />

<!-- Some shit I snatched from the internet :demon: -->
<style>
	.stripes {
		background-image: repeating-linear-gradient(
			45deg,
			transparent,
			#2b2b2b33 12px,
			transparent 0px,
			transparent 0px
		);
	}

	.dots {
		background-image: radial-gradient(#22222281 1px, transparent 1px);
		background-size: 10px 10px;
		background-repeat: repeat;
	}
</style>
