<script lang="ts">
	import type { PageData } from './$types';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Rules from '$lib/components/Rules.svelte';
	import Category from '$lib/components/Category.svelte';
	import Header from '$lib/components/Header.svelte';
	import { deserialize, enhance } from '$app/forms';
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
	import type { SavedPlay, RebuttalTally } from '$lib/savedPlay';
	import { isInRebuttalBand, MAX_REBUTTALS_PER_PLAY } from '$lib/rebuttalRules';
	import { setDecidedRebuttalIds } from '$lib/rebuttalInbox';
	import favicon from '$lib/assets/favicon.svg';
	import faviconLight from '$lib/assets/favicon-light.svg';

	export let data: PageData;

	const GAME_MS = 100_000;

	$: if (browser) {
		setDecidedRebuttalIds(data.decidedRebuttalIds ?? []);
	}

	let responseArray: boolean[] = data.play?.validationResults ?? [];
	let answerArray: string[] = data.play?.answers ?? [];
	let answersSubmitted = Boolean(data.play);
	let revealAnswers = false;
	let scoresModalOpen = false;
	let scoreEntry: 'scores' | 'rebuttals' = 'scores';
	let rulesOpen = false;
	let judgeCards = false;
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
	let sentRebuttals = rebuttalFlags(data.play?.rebuttalPositions);
	let rebuttalVotes = voteTallies(data.play?.rebuttalVotes);
	let yesProbabilities: (number | null)[] = data.play?.yesProbabilities ?? Array.from({ length: 12 }, () => null);
	let profaneAnswers = data.play?.profane ?? Array.from({ length: 12 }, () => false);
	let rebuttalBusyPosition = 0;

	function rebuttalFlags(positions: number[] | undefined): boolean[] {
		const flags = Array.from({ length: 12 }, () => false);
		for (const position of positions ?? []) {
			if (position >= 1 && position <= 12) {
				flags[position - 1] = true;
			}
		}
		return flags;
	}

	function voteTallies(rows: RebuttalTally[] | undefined): { yes: number; no: number }[] {
		const tallies = Array.from({ length: 12 }, () => ({ yes: 0, no: 0 }));
		for (const row of rows ?? []) {
			if (row.position >= 1 && row.position <= 12) {
				tallies[row.position - 1] = { yes: row.yes, no: row.no };
			}
		}
		return tallies;
	}

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
	$: rebuttalEligible = boardAnswers.reduce((count, answer, index) => {
		if ((answer ?? '').trim().length === 0 || boardCorrect[index] || profaneAnswers[index]) {
			return count;
		}
		if (!isInRebuttalBand(yesProbabilities[index] ?? null, null)) {
			return count;
		}
		return count + 1;
	}, 0);
	$: rebuttalPossible = Math.min(MAX_REBUTTALS_PER_PLAY, rebuttalEligible);
	$: rebuttalUsed = sentRebuttals.filter(Boolean).length;
	$: rebuttalLeft = Math.max(0, rebuttalPossible - rebuttalUsed);
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
			scoreEntry = 'scores';
			judgeCards = true;
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
				profane?: boolean[];
				rebuttalPositions?: number[];
				rebuttalVotes?: RebuttalTally[];
				yesProbabilities?: (number | null)[];
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
			if (Array.isArray(dataResult.profane)) {
				profaneAnswers = dataResult.profane;
			}
			sentRebuttals = rebuttalFlags(dataResult.rebuttalPositions);
			rebuttalVotes = voteTallies(dataResult.rebuttalVotes);
			if (Array.isArray(dataResult.yesProbabilities)) {
				yesProbabilities = dataResult.yesProbabilities;
			}
			answersSubmitted = true;
			revealAnswers = true;
			recordLocalPlay({
				categories,
				answers: answerArray,
				validationResults: responseArray
			});
			scoreEntry = 'scores';
			judgeCards = true;
			window.setTimeout(() => {
				scoresModalOpen = true;
			}, 280);
		} else {
			console.error('Validation failed:', result);
		}
	}

	async function submitRebuttal(position: number): Promise<boolean> {
		if (rebuttalBusyPosition !== 0 || sentRebuttals[position - 1] || rebuttalLeft < 1) {
			return false;
		}
		rebuttalBusyPosition = position;
		try {
			const body = new FormData();
			body.set('player_id', playerId);
			body.set('tz', browserTimeZone());
			body.set('position', String(position));
			const response = await fetch('?/submitRebuttal', {
				method: 'POST',
				body,
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await response.text());
			if (
				result.type !== 'success' ||
				!result.data ||
				typeof result.data !== 'object' ||
				!('sent' in result.data) ||
				result.data.sent !== true
			) {
				return false;
			}
			const yes = 'yes' in result.data && typeof result.data.yes === 'number' ? result.data.yes : 0;
			const no = 'no' in result.data && typeof result.data.no === 'number' ? result.data.no : 0;
			sentRebuttals[position - 1] = true;
			rebuttalVotes[position - 1] = { yes, no };
			sentRebuttals = sentRebuttals;
			rebuttalVotes = rebuttalVotes;
			return true;
		} finally {
			rebuttalBusyPosition = 0;
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
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="cursor-pointer text-sm text-dark/60 underline-offset-2 hover:underline dark:text-light/60"
				on:click={() => (rulesOpen = true)}
			>
				Rules
			</button>
			<ThemeToggle />
		</div>
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
			<div class="flex w-full flex-1 flex-col items-center {scoresModalOpen ? 'blur' : ''}">
			<Landing
				name={playerName}
				{firstVisit}
				{dateLabel}
				onStart={enterPuzzle}
				onTutorial={() => {
					screen = 'tutorial';
				}}
				onRebuttals={() => {
					scoreEntry = 'rebuttals';
					judgeCards = false;
					scoresModalOpen = true;
				}}
			/>
			</div>
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
								{#if answersSubmitted && !viewingPast && rebuttalPossible > 0}
									<p class="mb-1 px-3 text-right text-xs text-dark/50 dark:text-light/50">
										{rebuttalLeft} left of {rebuttalPossible}
									</p>
								{/if}
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
											canRebuttal={!viewingPast &&
												(boardAnswers[index] ?? '').trim().length > 0 &&
												!boardCorrect[index] &&
												!profaneAnswers[index] &&
												(Boolean(sentRebuttals[index]) ||
													isInRebuttalBand(yesProbabilities[index] ?? null, null))}
											rebuttalSent={sentRebuttals[index] ?? false}
											rebuttalBusy={rebuttalBusyPosition !== 0}
											rebuttalOpen={rebuttalLeft > 0}
											rebuttalYes={rebuttalVotes[index]?.yes ?? 0}
											rebuttalNo={rebuttalVotes[index]?.no ?? 0}
											onRebuttal={() => submitRebuttal(index + 1)}
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
									scoreEntry = 'scores';
									judgeCards = true;
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
			<Rules open={rulesOpen} onClose={() => (rulesOpen = false)} />
		{/if}
		<Scorecard
			open={scoresModalOpen}
			judge={judgeCards}
			{playerId}
			score={todayScore}
			startView={scoreEntry}
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
				judgeCards = false;
				scoreEntry = 'scores';
			}}
			onSave={(saved) => {
				playerProfile = saved;
				playerName = saved.name ?? '';
				writePlayerName(playerName);
			}}
		/>
	</div>
</main>
