<script lang="ts">
	import type { PageData } from './$types';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Category from '$lib/components/Category.svelte';
	import Header from '$lib/components/Header.svelte';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { getOrCreatePlayerId } from '$lib/playerId';
	import { hasLocalHistory, recordLocalPlay } from '$lib/localPlay';
	import { readPlayerName, writePlayerName } from '$lib/playerName';
	import { collectPlayClient } from '$lib/playClient';
	import { formatPuzzleDate } from '$lib/puzzleDate';
	import Scorecard from '$lib/components/Scorecard.svelte';
	import PuzzleSkeleton from '$lib/components/PuzzleSkeleton.svelte';
	import Landing from '$lib/components/Landing.svelte';
	import Tutorial from '$lib/components/Tutorial.svelte';
	import type { PlayerProfile } from '$lib/playerProfile';
	import type { ScoreboardStats } from '$lib/scoreboard';
	import favicon from '$lib/assets/favicon.svg';
	import faviconLight from '$lib/assets/favicon-light.svg';

	export let data: PageData;

	const GAME_MS = 100_000;

	let responseArray: boolean[] = data.play?.validationResults ?? [];
	let answerArray: string[] = data.play?.answers ?? [];
	let answersSubmitted = Boolean(data.play);
	let revealAnswers = false;
	let scoresModalOpen = false;
	let screen: 'landing' | 'tutorial' | 'puzzle' = data.play ? 'puzzle' : 'landing';
	let playerName = browser ? readPlayerName() : '';
	let firstVisit = browser ? !hasLocalHistory() && !data.play : !data.play;
	let playerProfile: PlayerProfile | null = data.player;
	let todayScore = data.play?.score ?? 0;
	let timeRemainingMs = data.play?.timeRemainingMs ?? 0;
	let scoreboard: ScoreboardStats | null = data.scoreboard;
	let formElement: HTMLFormElement;
	let isValidating = false;
	let playerId = browser ? getOrCreatePlayerId() : '';
	let remainingMs = data.play ? 0 : GAME_MS;
	let startedAt = 0;
	let timerInterval: ReturnType<typeof setInterval> | undefined;
	let scrollPosition = 0;

	$: categories = data.categories;
	$: letter = data.letter;
	$: puzzleReady = Boolean(playerId) && letter.length > 0 && categories.length === 12;
	$: dateLabel = data.date ? formatPuzzleDate(data.date) : '';
	$: timer = Math.floor(remainingMs / 1000);
	$: milliseconds = remainingMs % 1000;
	$: if (!answersSubmitted && answerArray.length !== categories.length) {
		answerArray = categories.map(() => '');
	}

	function browserTimeZone(): string {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = undefined;
		}
	}

	function syncTimer() {
		if (!startedAt || answersSubmitted || isValidating) {
			return;
		}

		remainingMs = Math.max(0, GAME_MS - (Date.now() - startedAt));
		if (remainingMs === 0) {
			stopTimer();
			handleTimerEnd();
		}
	}

	function startTimer() {
		stopTimer();
		startedAt = Date.now();
		remainingMs = GAME_MS;
		timerInterval = setInterval(syncTimer, 50);
	}

	function enterPuzzle() {
		screen = 'puzzle';
		if (!answersSubmitted && letter.length > 0 && categories.length === 12) {
			startTimer();
		}
	}

	onMount(() => {
		if (!playerId) {
			playerId = getOrCreatePlayerId();
		}

		const storedName = readPlayerName() || data.player?.name || '';
		playerName = storedName;
		if (data.player?.name) {
			writePlayerName(data.player.name);
			playerName = data.player.name;
		}
		firstVisit = !hasLocalHistory() && !data.play;

		if (answersSubmitted) {
			screen = 'puzzle';
			requestAnimationFrame(() => {
				scoresModalOpen = true;
			});
		} else {
			screen = 'landing';
		}

		if (window.location.search.includes('tz=')) {
			const url = new URL(window.location.href);
			url.searchParams.delete('tz');
			history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
		}

		scrollPosition = window.scrollY;

		let ticking = false;
		const handleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					scrollPosition = window.scrollY;
					ticking = false;
				});
				ticking = true;
			}
		};

		const catchUpTimer = () => {
			syncTimer();
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		document.addEventListener('visibilitychange', catchUpTimer);
		window.addEventListener('focus', catchUpTimer);
		return () => {
			window.removeEventListener('scroll', handleScroll);
			document.removeEventListener('visibilitychange', catchUpTimer);
			window.removeEventListener('focus', catchUpTimer);
			stopTimer();
		};
	});

	function collectAnswers(): string[] {
		if (!formElement) {
			return answerArray;
		}

		return categories.map((_, index) => {
			const field = formElement.elements.namedItem(`answer-${index + 1}`);
			if (field instanceof HTMLInputElement) {
				return field.value;
			}
			return answerArray[index] ?? '';
		});
	}

	function handleValidationResponse(result: unknown) {
		if (
			typeof result === 'object' &&
			result !== null &&
			'type' in result &&
			result.type === 'success' &&
			'data' in result &&
			typeof result.data === 'object' &&
			result.data !== null &&
			'validationResults' in result.data &&
			Array.isArray(result.data.validationResults)
		) {
			const dataResult = result.data as {
				validationResults: boolean[];
				answers?: string[];
				score?: number;
				timeRemainingMs?: number;
				player?: PlayerProfile | null;
				scoreboard?: ScoreboardStats | null;
			};
			responseArray = dataResult.validationResults;
			if (Array.isArray(dataResult.answers)) {
				answerArray = dataResult.answers;
			}
			if (typeof dataResult.score === 'number') {
				todayScore = dataResult.score;
			} else {
				todayScore = dataResult.validationResults.filter(Boolean).length;
			}
			if (dataResult.player) {
				playerProfile = dataResult.player;
				localStorage.setItem('streak', String(dataResult.player.streak));
			}
			if (typeof dataResult.timeRemainingMs === 'number') {
				timeRemainingMs = dataResult.timeRemainingMs;
			}
			if (dataResult.scoreboard) {
				scoreboard = dataResult.scoreboard;
			}
			answersSubmitted = true;
			revealAnswers = true;
			recordLocalPlay({
				categories,
				answers: answerArray,
				validationResults: responseArray
			});
			window.setTimeout(() => {
				scoresModalOpen = true;
			}, 280);
		} else {
			console.error('Validation failed:', result);
		}
	}

	function handleTimerEnd() {
		if (formElement && !answersSubmitted && !isValidating) {
			formElement.requestSubmit();
		}
	}
</script>

<main class="mx-auto flex w-full max-w-3xl flex-1 flex-col">
	<div
		class="sticky top-0 z-10 flex items-center justify-between bg-light/60 px-4 backdrop-blur-sm dark:bg-dark/60"
	>
		<a href="/" data-sveltekit-reload aria-label="Groople" class="cursor-pointer">
			{#if $theme === 'dark'}
				<img src={faviconLight} alt="Groople Logo" class="h-8 w-8" />
			{:else}
				<img src={favicon} alt="Groople Logo" class="h-8 w-8" />
			{/if}
		</a>
		<div
			class="transition-all duration-300 ease-out"
			style="opacity: {scrollPosition > 100 ? 1 : 0}; transform: scale({scrollPosition > 100
				? 1
				: 0.8}); pointer-events: {scrollPosition > 100 ? 'auto' : 'none'};"
		>
			{#if screen === 'puzzle' && puzzleReady}
				<Header {letter} {timer} {milliseconds} inTopBar={true} />
			{/if}
		</div>
		<ThemeToggle />
	</div>

	{#if screen === 'puzzle'}
		<div
			class="mb-6 transition-opacity duration-300 ease-out"
			style="opacity: {scrollPosition > 100 ? 0 : 1};"
		>
			{#if puzzleReady}
				<Header {letter} {timer} {milliseconds} />
			{/if}
		</div>
	{/if}

	<div class="relative flex w-full flex-1 flex-col items-center px-4">
		{#if screen === 'landing'}
			<Landing
				name={playerName}
				{firstVisit}
				{dateLabel}
				onStart={enterPuzzle}
				onTutorial={() => {
					screen = 'tutorial';
				}}
			/>
		{:else if screen === 'tutorial'}
			<Tutorial
				onComplete={enterPuzzle}
				onBack={() => {
					screen = 'landing';
				}}
			/>
		{:else}
		<div class="relative mt-5 flex w-full flex-col items-center {scoresModalOpen ? 'blur' : ''}">
			{#if !puzzleReady}
				<PuzzleSkeleton />
			{:else}
				<form
					bind:this={formElement}
					method="POST"
					action="?/validate"
					use:enhance={({ formData }) => {
						isValidating = true;
						stopTimer();
						formData.set('tz', browserTimeZone());
						formData.set('time_remaining_ms', String(remainingMs));
						formData.set('client', JSON.stringify(collectPlayClient($theme)));
						answerArray = collectAnswers();
						return async ({ result, update }) => {
							await update({ reset: false });
							handleValidationResponse(result);
							isValidating = false;
						};
					}}
					class="w-full"
				>
					<input type="hidden" name="letter" value={letter} />
					<input type="hidden" name="player_id" value={playerId} />
					{#if isValidating}
						<PuzzleSkeleton scoring />
					{:else}
						{#each categories as category, index}
							<div class="w-full">
								<Category
									loading={isValidating}
									index={index + 1}
									{category}
									{letter}
									valid={responseArray[index] ? 'yes' : 'no'}
									{answersSubmitted}
									disabled={scoresModalOpen}
									recordedAnswer={answerArray[index] ?? ''}
									reveal={revealAnswers}
								/>
							</div>
						{/each}
					{/if}
					{#if !answersSubmitted}
						<button
							type="submit"
							class="mb-5 w-full cursor-pointer rounded-md bg-dark p-2 text-light outline disabled:cursor-not-allowed disabled:opacity-50 dark:bg-light dark:text-dark"
							disabled={isValidating}
						>
							{isValidating ? 'Scoring...' : 'Submit'}
						</button>
					{:else if !scoresModalOpen}
						<button
							type="button"
							class="mb-5 w-full cursor-pointer rounded-md bg-dark p-2 text-light dark:bg-light dark:text-dark"
							on:click={() => {
								scoresModalOpen = true;
							}}
						>
							Results
						</button>
					{/if}
				</form>
			{/if}
		</div>
		<Scorecard
			open={scoresModalOpen}
			{playerId}
			score={todayScore}
			player={playerProfile}
			{scoreboard}
			timezone={browserTimeZone()}
			{dateLabel}
			{letter}
			correct={responseArray}
			onClose={() => {
				scoresModalOpen = false;
			}}
			onSave={(saved) => {
				playerProfile = saved;
				playerName = saved.name ?? '';
				writePlayerName(playerName);
			}}
		/>
		{/if}
	</div>
</main>
