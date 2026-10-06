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
	import Countdown from '$lib/components/Countdown.svelte';
	import type { PlayerProfile } from '$lib/playerProfile';
	import type { ScoreboardStats } from '$lib/scoreboard';
	import type { SavedPlay } from '$lib/savedPlay';
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
	let archive: ArchiveBoard | null = null;
	let archiveLoading = false;
	let archiveRequest = 0;

	type ArchiveBoard = {
		date: string;
		categories: string[];
		letter: string;
		answers: string[];
		validationResults: boolean[];
		timeRemainingMs: number;
	};

	$: categories = data.categories;
	$: letter = data.letter;
	$: boardCategories = archive?.categories ?? categories;
	$: boardLetter = archive?.letter ?? letter;
	$: boardAnswers = archive?.answers ?? answerArray;
	$: boardCorrect = archive?.validationResults ?? responseArray;
	$: viewingPast = archive !== null;
	$: puzzleReady = Boolean(playerId) && letter.length > 0 && categories.length === 12;
	$: dateLabel = data.date ? formatPuzzleDate(data.date) : '';
	$: headerRemainingMs = archive ? archive.timeRemainingMs : remainingMs;
	$: timer = Math.floor(headerRemainingMs / 1000);
	$: milliseconds = headerRemainingMs % 1000;
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

	function backToToday() {
		archiveRequest += 1;
		archive = null;
		archiveLoading = false;
	}

	function isStringList(value: unknown, length: number): value is string[] {
		return (
			Array.isArray(value) &&
			value.length === length &&
			value.every((item) => typeof item === 'string')
		);
	}

	function isSavedPlay(
		value: unknown
	): value is Pick<SavedPlay, 'answers' | 'validationResults' | 'timeRemainingMs'> {
		if (!value || typeof value !== 'object') {
			return false;
		}
		const play = value as Partial<SavedPlay>;
		return (
			isStringList(play.answers, 12) &&
			Array.isArray(play.validationResults) &&
			play.validationResults.length === 12 &&
			play.validationResults.every((item) => typeof item === 'boolean') &&
			typeof play.timeRemainingMs === 'number'
		);
	}

	async function openPlayedDay(date: string) {
		if (date === data.date) {
			backToToday();
			return;
		}

		const request = ++archiveRequest;
		archiveLoading = true;
		try {
			const response = await fetch('/api/puzzle', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					accept: 'application/json'
				},
				body: JSON.stringify({
					playerId,
					date,
					tz: browserTimeZone()
				})
			});
			if (!response.ok || request !== archiveRequest) {
				return;
			}

			const puzzle: unknown = await response.json();
			if (!puzzle || typeof puzzle !== 'object' || request !== archiveRequest) {
				return;
			}

			const body = puzzle as {
				date?: unknown;
				categories?: unknown;
				letter?: unknown;
				play?: unknown;
			};
			if (
				typeof body.date !== 'string' ||
				typeof body.letter !== 'string' ||
				!isStringList(body.categories, 12) ||
				!isSavedPlay(body.play)
			) {
				return;
			}

			archive = {
				date: body.date,
				categories: body.categories,
				letter: body.letter,
				answers: body.play.answers,
				validationResults: body.play.validationResults,
				timeRemainingMs: body.play.timeRemainingMs
			};
		} finally {
			if (request === archiveRequest) {
				archiveLoading = false;
			}
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
				<Header letter={boardLetter} {timer} {milliseconds} inTopBar={true} />
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
				<Header letter={boardLetter} {timer} {milliseconds} />
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
				{#if archiveLoading || !puzzleReady}
					<PuzzleSkeleton />
					{#if archiveLoading}
						<button
							type="button"
							class="mt-5 mb-5 w-full cursor-pointer rounded-md bg-dark p-2 text-light dark:bg-light dark:text-dark"
							on:click={backToToday}
						>
							Back to today
						</button>
					{/if}
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
							<PuzzleSkeleton scoring answers={answerArray} />
						{:else}
							{#key archive?.date ?? 'today'}
								{#each boardCategories as category, index}
									<div class="w-full">
										<Category
											loading={isValidating}
											index={index + 1}
											{category}
											letter={boardLetter}
											valid={boardCorrect[index] ? 'yes' : 'no'}
											answersSubmitted={viewingPast || answersSubmitted}
											disabled={scoresModalOpen || viewingPast}
											recordedAnswer={boardAnswers[index] ?? ''}
											reveal={viewingPast || revealAnswers}
										/>
									</div>
								{/each}
							{/key}
						{/if}
						{#if archive}
							<p class="mb-3 text-center text-sm text-gray-400">
								{formatPuzzleDate(archive.date)}
							</p>
							<button
								type="button"
								class="mb-5 w-full cursor-pointer rounded-md bg-dark p-2 text-light dark:bg-light dark:text-dark"
								on:click={backToToday}
							>
								Back to today
							</button>
						{:else if !answersSubmitted}
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
			<Countdown
				seconds={timer}
				active={screen === 'puzzle' && puzzleReady && !answersSubmitted && !isValidating}
			/>
			<Scorecard
				open={scoresModalOpen}
				{playerId}
				score={todayScore}
				player={playerProfile}
				{scoreboard}
				timezone={browserTimeZone()}
				puzzleDate={data.date}
				{dateLabel}
				{letter}
				correct={responseArray}
				onOpenDay={openPlayedDay}
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
