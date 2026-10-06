<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import User from 'phosphor-svelte/lib/User';
	import Globe from 'phosphor-svelte/lib/Globe';
	import Fire from 'phosphor-svelte/lib/Fire';
	import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import LinkPinch from '$lib/components/LinkPinch.svelte';
	import X from 'phosphor-svelte/lib/X';
	import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
	import Histogram from '$lib/components/Histogram.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import type { PlayerProfile } from '$lib/playerProfile';
	import {
		emptyHistogram,
		histogramTotal,
		includeScore,
		type ScoreboardStats
	} from '$lib/scoreboard';
	import { readPersonalHistogram } from '$lib/localPlay';
	import { nameInitials, writePlayerName } from '$lib/playerName';
	import { shareText } from '$lib/shareResult';
	import { browser } from '$app/environment';

	export let open = false;
	export let playerId: string;
	export let score: number;
	export let player: PlayerProfile | null;
	export let scoreboard: ScoreboardStats | null;
	export let timezone: string;
	export let puzzleDate = '';
	export let dateLabel = '';
	export let letter = '';
	export let correct: boolean[] = [];
	export let onClose: () => void = () => {};
	export let onSave: (player: PlayerProfile) => void = () => {};
	export let onOpenDay: (date: string) => void = () => {};

	const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

	let scope: 'you' | 'world' = 'world';
	let showCalendar = false;
	let playedDates: string[] = [];
	let datesLoadedFor = '';
	let datesLoading = false;
	let visibleMonth = monthStart(puzzleDate);
	let view: 'scores' | 'feedback' | 'thanks' = 'scores';
	let direction = 1;
	let switching = false;
	let nameValue = player?.name ?? '';
	let emailValue = player?.email ?? '';
	let feedbackBody = '';
	let errorMessage = '';
	let feedbackError = '';
	let submitting = false;
	let wasOpen = false;
	let copied = false;
	let shareIcon: LinkPinch;
	let formElement: HTMLFormElement;

	$: if (player) {
		nameValue = player.name ?? '';
		if (view !== 'feedback') {
			emailValue = player.email ?? '';
		}
	}

	$: dialogLabel =
		view === 'scores' ? 'scoreboard-title' : view === 'thanks' ? 'thanks-title' : 'feedback-title';

	$: if (open && !wasOpen) {
		view = 'scores';
		direction = 1;
		switching = false;
		feedbackBody = '';
		feedbackError = '';
		submitting = false;
		showCalendar = false;
		visibleMonth = monthStart(puzzleDate);
	}
	$: wasOpen = open;
	$: played = new Set(playedDates);
	$: monthCells = buildMonth(visibleMonth);

	$: localPersonal = browser ? readPersonalHistogram() : emptyHistogram();
	$: personal = includeScore(
		scoreboard && histogramTotal(scoreboard.personal) > 0 ? scoreboard.personal : localPersonal,
		score
	);
	$: world = includeScore(scoreboard?.world ?? emptyHistogram(), score);
	$: activeCounts = scope === 'you' ? personal : world;
	$: streak = player?.streak ?? 0;
	$: initials = nameInitials(nameValue);

	async function copyResult() {
		const text = shareText({ dateLabel, letter, correct });
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			shareIcon?.play();
			if (playerId && puzzleDate) {
				const body = new FormData();
				body.set('player_id', playerId);
				body.set('date', puzzleDate);
				void fetch('?/share', { method: 'POST', body });
			}
			window.setTimeout(() => {
				copied = false;
			}, 1700);
		} catch {
			errorMessage = 'Could not copy';
		}
	}

	function saveProfile() {
		writePlayerName(nameValue);
		formElement?.requestSubmit();
	}

	function showView(next: 'scores' | 'feedback' | 'thanks', dir: number) {
		direction = dir;
		switching = true;
		view = next;
		window.setTimeout(() => {
			switching = false;
		}, 260);
	}

	function monthStart(isoDate: string): Date {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
		if (!match) {
			const now = new Date();
			return new Date(now.getFullYear(), now.getMonth(), 1);
		}
		return new Date(Number(match[1]), Number(match[2]) - 1, 1);
	}

	function shiftMonth(delta: number) {
		visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1);
	}

	function buildMonth(month: Date): Array<{ date: string; day: number } | null> {
		const year = month.getFullYear();
		const monthIndex = month.getMonth();
		const firstWeekday = new Date(year, monthIndex, 1).getDay();
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
		const cells: Array<{ date: string; day: number } | null> = [];
		for (let index = 0; index < firstWeekday; index += 1) {
			cells.push(null);
		}
		for (let day = 1; day <= daysInMonth; day += 1) {
			const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			cells.push({ date, day });
		}
		return cells;
	}

	async function loadPlayedDates() {
		if (!playerId || datesLoadedFor === playerId || datesLoading) {
			return;
		}
		datesLoading = true;
		try {
			const response = await fetch('/api/plays', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					accept: 'application/json'
				},
				body: JSON.stringify({ playerId })
			});
			if (!response.ok) {
				return;
			}
			const body: unknown = await response.json();
			if (body && typeof body === 'object' && 'dates' in body && Array.isArray(body.dates)) {
				playedDates = body.dates.filter((date): date is string => typeof date === 'string');
				datesLoadedFor = playerId;
			}
		} finally {
			datesLoading = false;
		}
	}

	function toggleCalendar() {
		showCalendar = !showCalendar;
		if (showCalendar) {
			void loadPlayedDates();
		}
	}

	function openDay(date: string) {
		if (!played.has(date)) {
			return;
		}
		onOpenDay(date);
		close();
	}

	function close() {
		onClose();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
		}
	}
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 160 }}
	>
		<button
			type="button"
			class="absolute inset-0 bg-dark/50 dark:bg-black/60"
			aria-label="Close scores"
			on:click={close}
		></button>
		<div
			class="relative z-10 grid max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-hidden rounded-2xl bg-light shadow-2xl dark:bg-neutral-900"
			in:scale={{ duration: 220, start: 0.94, easing: cubicOut }}
			role="dialog"
			aria-modal="true"
			aria-labelledby={dialogLabel}
		>
			{#key view}
				<div
					class="col-start-1 row-start-1 max-h-[calc(100dvh-2rem)] overflow-y-auto px-6 py-7"
					in:fly|local={{
						x: switching ? direction * 32 : 0,
						duration: switching ? 240 : 0,
						easing: cubicOut
					}}
					out:fly|local={{
						x: switching ? direction * -32 : 0,
						duration: switching ? 220 : 0,
						easing: cubicOut
					}}
				>
					{#if view === 'feedback'}
						<form
							class="font-inter"
							method="POST"
							action="?/feedback"
							use:enhance={({ formData, cancel }) => {
								feedbackError = '';
								const body = feedbackBody.trim();
								if (!body) {
									feedbackError = 'Leave some feedback';
									cancel();
									return;
								}
								formData.set('player_id', playerId);
								formData.set('email', emailValue);
								formData.set('body', body);
								submitting = true;
								return async ({ result }) => {
									submitting = false;
									if (
										result.type === 'success' &&
										result.data &&
										typeof result.data === 'object' &&
										'success' in result.data &&
										result.data.success &&
										'player' in result.data
									) {
										onSave(result.data.player as PlayerProfile);
										feedbackBody = '';
										showView('thanks', 1);
										return;
									}

									feedbackError =
										result.type === 'success' &&
										result.data &&
										typeof result.data === 'object' &&
										'error' in result.data &&
										typeof result.data.error === 'string'
											? result.data.error
											: 'Could not save feedback';
								};
							}}
						>
							<div class="flex items-center gap-3">
								<button
									type="button"
									class="cursor-pointer text-dark dark:text-light"
									aria-label="Back"
									on:click={() => showView('scores', -1)}
								>
									<svelte:component this={ArrowLeft} size={22} />
								</button>
								<h2 id="feedback-title" class="font-inter text-2xl text-dark dark:text-light">
									Feedback
								</h2>
							</div>
							<label class="mt-6 block">
								<span class="text-base text-dark dark:text-light">Email</span>
								<input
									name="email"
									type="email"
									bind:value={emailValue}
									maxlength="254"
									autocomplete="email"
									placeholder="Optional - only if you want a response"
									class="mt-2 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-base text-dark placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:text-light dark:focus:border-gray-500"
								/>
							</label>
							<label class="mt-4 block">
								<span class="text-base text-dark dark:text-light">Message</span>
								<textarea
									name="body"
									bind:value={feedbackBody}
									maxlength="4000"
									placeholder="Your feedback for the developer..."
									class="mt-2 field-sizing-content max-h-48 min-h-24 w-full resize-none rounded-xl border border-gray-200 bg-transparent px-3 py-3 text-base text-dark placeholder:text-gray-400 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:text-light dark:focus:border-gray-500"
								></textarea>
							</label>
							<button
								type="submit"
								class="mt-6 w-full cursor-pointer rounded-md bg-dark p-2 text-light outline disabled:cursor-not-allowed disabled:opacity-50 dark:bg-light dark:text-dark"
								disabled={submitting}
							>
								{submitting ? 'Sending...' : 'Submit'}
							</button>
							{#if feedbackError}
								<p class="mt-2 text-center text-sm text-red-600 dark:text-red-400">
									{feedbackError}
								</p>
							{/if}
						</form>
					{:else if view === 'thanks'}
						<div class="font-inter">
							<button
								type="button"
								class="cursor-pointer text-dark dark:text-light"
								aria-label="Back"
								on:click={() => showView('scores', -1)}
							>
								<svelte:component this={ArrowLeft} size={22} />
							</button>
							<h2
								id="thanks-title"
								class="mt-16 mb-8 text-center font-inter text-2xl text-dark dark:text-light"
							>
								Thanks — got it.
							</h2>
						</div>
					{:else}
						<form
							bind:this={formElement}
							method="POST"
							action="?/profile"
							use:enhance={({ formData }) => {
								errorMessage = '';
								formData.set('tz', timezone);
								formData.set('player_id', playerId);
								formData.set('name', nameValue);
								return async ({ result }) => {
									if (
										result.type === 'success' &&
										result.data &&
										typeof result.data === 'object' &&
										'success' in result.data &&
										result.data.success &&
										'player' in result.data
									) {
										const saved = result.data.player as PlayerProfile;
										writePlayerName(saved.name ?? nameValue);
										onSave(saved);
										return;
									}

									errorMessage =
										result.type === 'success' &&
										result.data &&
										typeof result.data === 'object' &&
										'error' in result.data &&
										typeof result.data.error === 'string'
											? result.data.error
											: 'Could not save';
								};
							}}
						>
							<div class="mb-1 flex items-center gap-2">
								<label class="flex min-w-0 flex-1 items-center gap-2">
									<span
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs text-dark dark:bg-neutral-800 dark:text-light"
									>
										{#if initials}
											{initials}
										{:else}
											<svelte:component this={User} size={14} weight="bold" />
										{/if}
									</span>
									<input
										name="name"
										bind:value={nameValue}
										maxlength="80"
										autocomplete="nickname"
										placeholder="Your name"
										on:blur={saveProfile}
										class="w-full min-w-0 bg-transparent text-base text-dark placeholder:text-gray-400 focus:outline-none dark:text-light"
									/>
								</label>
								<div class="flex rounded-full border border-gray-200 dark:border-gray-700">
									<Tooltip text="You" align="end" side="bottom">
										<button
											type="button"
											class="flex cursor-pointer items-center gap-1 rounded-l-full px-2.5 py-1 {scope ===
											'you'
												? 'bg-dark text-light dark:bg-light dark:text-dark'
												: 'text-gray-400'}"
											aria-label="You"
											on:click={() => (scope = 'you')}
										>
											<svelte:component this={User} size={14} weight="bold" />
										</button>
									</Tooltip>
									<Tooltip text="World" align="end" side="bottom">
										<button
											type="button"
											class="flex cursor-pointer items-center gap-1 rounded-r-full px-2.5 py-1 {scope ===
											'world'
												? 'bg-dark text-light dark:bg-light dark:text-dark'
												: 'text-gray-400'}"
											aria-label="World"
											on:click={() => (scope = 'world')}
										>
											<svelte:component this={Globe} size={14} weight="bold" />
										</button>
									</Tooltip>
								</div>
								<Tooltip text="Calendar" align="end" side="bottom">
									<button
										type="button"
										class="flex cursor-pointer items-center rounded-full border border-gray-200 px-2.5 py-1 dark:border-gray-700 {showCalendar
											? 'bg-dark text-light dark:bg-light dark:text-dark'
											: 'text-gray-400'}"
										aria-label="Calendar"
										aria-pressed={showCalendar}
										on:click={toggleCalendar}
									>
										<svelte:component this={CalendarBlank} size={14} weight="bold" />
									</button>
								</Tooltip>
								<button
									type="button"
									class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
									aria-label="Close"
									on:click={close}
								>
									<svelte:component this={X} size={18} weight="bold" />
								</button>
							</div>

							<div class="mt-4 flex flex-wrap justify-evenly gap-x-2 gap-y-4 text-center">
								<div class="min-w-20 flex-1">
									<h2 id="scoreboard-title" class="m-0 text-5xl text-dark dark:text-light">
										{score}
									</h2>
									<p class="mt-1 text-xs tracking-widest text-gray-400 uppercase">Score</p>
								</div>
								<div class="min-w-20 flex-1">
									<h2 class="m-0 text-5xl text-dark dark:text-light">{streak}</h2>
									<p
										class="mt-1 flex items-center justify-center gap-1 text-xs tracking-widest text-gray-400 uppercase"
									>
										<svelte:component this={Fire} size={12} weight="fill" /> Streak
									</p>
								</div>
								<button
									type="button"
									class="min-w-20 flex-1 cursor-pointer rounded-xl px-1 py-1 text-dark hover:bg-neutral-200/70 dark:text-light dark:hover:bg-neutral-800"
									aria-label="Share result"
									on:click={copyResult}
								>
									<span class="flex h-12 items-center justify-center">
										<LinkPinch bind:this={shareIcon} />
									</span>
									<p class="mt-1 text-xs tracking-widest text-gray-400 uppercase">
										{copied ? 'Copied' : 'Share'}
									</p>
								</button>
							</div>

							<div class="mt-8">
								{#if showCalendar}
									<div class="flex items-center justify-between">
										<button
											type="button"
											class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
											aria-label="Previous month"
											on:click={() => shiftMonth(-1)}
										>
											<svelte:component this={CaretLeft} size={16} weight="bold" />
										</button>
										<p class="text-sm text-dark dark:text-light">
											{visibleMonth.toLocaleDateString('en-US', {
												month: 'long',
												year: 'numeric'
											})}
										</p>
										<button
											type="button"
											class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
											aria-label="Next month"
											on:click={() => shiftMonth(1)}
										>
											<svelte:component this={CaretRight} size={16} weight="bold" />
										</button>
									</div>
									<div class="mt-3 grid grid-cols-7 gap-1 text-center">
										{#each WEEKDAYS as weekday, index (index)}
											<span class="text-xs text-gray-400">{weekday}</span>
										{/each}
										{#each monthCells as cell}
											{#if cell && played.has(cell.date)}
												<button
													type="button"
													class="flex h-9 cursor-pointer items-center justify-center rounded-md bg-gray-200 text-sm text-dark dark:bg-neutral-700 dark:text-light"
													aria-label="Open {cell.date}"
													on:click={() => openDay(cell.date)}
												>
													{cell.day}
												</button>
											{:else if cell}
												<span class="flex h-9 items-center justify-center text-sm text-gray-400">
													{cell.day}
												</span>
											{:else}
												<span class="h-9"></span>
											{/if}
										{/each}
									</div>
								{:else}
									{#key scope}
										<Histogram counts={activeCounts} highlight={score} variant="columns" />
									{/key}
								{/if}
							</div>

							<div class="mt-6 text-center text-sm text-gray-400">
								{#if dateLabel}
									{dateLabel}<span
										class="mx-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle"
									></span>
								{/if}Play again tomorrow<span
									class="mx-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle"
								></span><button
									type="button"
									class="cursor-pointer text-gray-400 underline underline-offset-2 transition-all hover:underline-offset-4"
									on:click={() => showView('feedback', 1)}
								>
									Leave Feedback
								</button>
							</div>

							{#if errorMessage}
								<p class="mt-2 text-center text-sm text-red-600 dark:text-red-400">
									{errorMessage}
								</p>
							{/if}
						</form>
					{/if}
				</div>
			{/key}
		</div>
	</div>
{/if}
