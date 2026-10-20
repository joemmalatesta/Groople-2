<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import User from 'phosphor-svelte/lib/User';
	import Fire from 'phosphor-svelte/lib/Fire';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import LinkPinch from '$lib/components/LinkPinch.svelte';
	import X from 'phosphor-svelte/lib/X';
	import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
	import Histogram from '$lib/components/Histogram.svelte';
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
	import { isRebuttalCard, type RebuttalCard } from '$lib/rebuttalRules';
	import {
		fetchRebuttalInbox,
		formatRebuttalDate,
		markRequestedRebuttalsSeen,
		voteOrder,
		type RebuttalInboxItem,
		unseenRebuttals
	} from '$lib/rebuttalInbox';

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
	export let judge = false;
	export let judgeCard: RebuttalCard | null = null;
	export let judgePosition = 0;
	export let judgeTotal = 0;
	export let onJudgeCard: (offer: {
		card: RebuttalCard | null;
		position: number;
		total: number;
	}) => void = () => {};
	export let startView: 'scores' | 'rebuttals' | 'calendar' = 'scores';
	export let rebuttalsOnly = false;

	const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

	let scope: 'you' | 'world' = 'world';
	let showCalendar = false;
	let showRebuttals = false;
	let paneSwitching = false;
	let histogramSwitching = false;
	let paneDirection = 1;

	type ScoreMode = 'you' | 'world' | 'calendar' | 'rebuttals';

	const scoreModeList: { id: ScoreMode; label: string }[] = [
		{ id: 'you', label: 'You' },
		{ id: 'world', label: 'World' },
		{ id: 'calendar', label: 'Calendar' },
		{ id: 'rebuttals', label: 'Rebuttals' }
	];

	const paneOrder: Record<ScoreMode, number> = {
		you: 0,
		world: 1,
		calendar: 2,
		rebuttals: 3
	};

	let activeScoreMode: ScoreMode = 'world';
	$: activeScoreMode = showRebuttals ? 'rebuttals' : showCalendar ? 'calendar' : scope;
	$: scoreChrome = rebuttalsOnly
		? 'rebuttals'
		: activeScoreMode === 'you' || activeScoreMode === 'world'
			? 'scores'
			: activeScoreMode;

	function selectScoreMode(mode: ScoreMode) {
		if (mode === activeScoreMode) {
			return;
		}
		const withinScores =
			(activeScoreMode === 'you' || activeScoreMode === 'world') &&
			(mode === 'you' || mode === 'world');
		paneDirection = paneOrder[mode] >= paneOrder[activeScoreMode] ? 1 : -1;
		paneSwitching = true;
		histogramSwitching = withinScores;
		window.setTimeout(() => {
			paneSwitching = false;
			histogramSwitching = false;
		}, 260);
		if (mode === 'rebuttals') {
			noteRebuttalsOpened();
			showRebuttals = true;
			showCalendar = false;
			return;
		}
		showRebuttals = false;
		if (mode === 'calendar') {
			showCalendar = true;
			void loadPlayedDates();
			return;
		}
		scope = mode;
		showCalendar = false;
	}
	let playedDates: string[] = [];
	let datesLoadedFor = '';
	let datesLoading = false;
	let visibleMonth = monthStart(puzzleDate);
	let view: 'scores' | 'feedback' | 'thanks' | 'rebuttals' = 'scores';
	let rebuttalItems: RebuttalInboxItem[] = [];
	let rebuttalCursor: string | null = null;
	let rebuttalHasMore = true;
	let rebuttalLoading = false;
	let rebuttalsLoaded = false;
	let rebuttalRequest = 0;
	let rebuttalScroller: HTMLDivElement | undefined;
	let direction = 1;
	let switching = false;
	let nameValue = player?.name ?? '';
	let emailValue = player?.email ?? '';
	let feedbackBody = '';
	let errorMessage = '';
	let feedbackError = '';
	let submitting = false;
	let modalWasOpen = false;
	let copied = false;
	let showingCard = false;
	let card: RebuttalCard | null = null;
	let cardsSeen = 0;
	let cardTotal = 0;
	let voting = false;
	let visitStarted = false;
	let shareIcon: LinkPinch;
	let formElement: HTMLFormElement;

	$: if (player) {
		nameValue = player.name ?? '';
		if (view !== 'feedback') {
			emailValue = player.email ?? '';
		}
	}

	$: dialogLabel = showingCard
		? 'rebuttal-card-title'
		: rebuttalsOnly
			? 'rebuttals-only-title'
			: view === 'scores'
				? 'scoreboard-title'
				: view === 'thanks'
					? 'thanks-title'
					: view === 'rebuttals'
						? 'rebuttals-title'
						: 'feedback-title';

	function syncModal(isOpen: boolean, shouldJudge: boolean) {
		if (isOpen === modalWasOpen) {
			return;
		}
		const justOpened = isOpen && !modalWasOpen;
		modalWasOpen = isOpen;
		if (!justOpened) {
			return;
		}
		view = 'scores';
		showRebuttals = rebuttalsOnly || startView === 'rebuttals';
		showCalendar = !rebuttalsOnly && startView === 'calendar';
		void ensureRebuttalsLoaded();
		if (showRebuttals) {
			noteRebuttalsOpened();
		}
		if (showCalendar) {
			void loadPlayedDates();
		}
		direction = 1;
		switching = false;
		paneSwitching = false;
		histogramSwitching = false;
		feedbackBody = '';
		feedbackError = '';
		submitting = false;
		if (rebuttalsOnly || !shouldJudge || !judgeCard) {
			showingCard = false;
			return;
		}
		if (!visitStarted) {
			visitStarted = true;
			card = judgeCard;
			cardsSeen = Math.max(0, judgePosition - 1);
			cardTotal = judgeTotal;
		}
		showingCard = card !== null;
	}

	$: syncModal(open, judge);
	$: if (open && visitStarted && judge && !rebuttalsOnly) {
		showingCard = card !== null;
	}
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
				void fetch('?/share', {
					method: 'POST',
					body,
					keepalive: true,
					headers: {
						accept: 'application/json',
						'x-sveltekit-action': 'true'
					}
				});
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

	function noteRebuttalsOpened() {
		markRequestedRebuttalsSeen();
	}

	async function ensureRebuttalsLoaded() {
		if (rebuttalsLoaded || rebuttalLoading) {
			return;
		}
		await loadRebuttalPage(true);
		rebuttalsLoaded = true;
	}

	async function loadRebuttalPage(reset: boolean) {
		if (rebuttalLoading && !reset) {
			return;
		}
		if (!reset && !rebuttalHasMore) {
			return;
		}
		const request = ++rebuttalRequest;
		rebuttalLoading = true;
		const page = await fetchRebuttalInbox({
			playerId,
			cursor: reset ? null : rebuttalCursor
		});
		if (request !== rebuttalRequest) {
			return;
		}
		rebuttalItems = reset ? page.items : [...rebuttalItems, ...page.items];
		rebuttalCursor = page.nextCursor;
		rebuttalHasMore = page.nextCursor !== null;
		rebuttalLoading = false;
	}

	function loadWhenSeen(node: HTMLElement, active: boolean) {
		let observer: IntersectionObserver | null = null;
		const attach = (on: boolean) => {
			observer?.disconnect();
			observer = null;
			const root = node.closest('[data-rebuttal-scroll]');
			if (!on || !(root instanceof HTMLElement)) {
				return;
			}
			observer = new IntersectionObserver(
				(entries) => {
					if (entries.some((entry) => entry.isIntersecting)) {
						loadRebuttalPage(false);
					}
				},
				{ root, threshold: 0 }
			);
			observer.observe(node);
		};
		attach(active);
		return {
			update(on: boolean) {
				attach(on);
			},
			destroy() {
				observer?.disconnect();
			}
		};
	}

	function showView(next: 'scores' | 'feedback' | 'thanks' | 'rebuttals', dir: number) {
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

	function finishJudging() {
		card = null;
		showingCard = false;
		onJudgeCard({ card: null, position: 0, total: 0 });
	}

	type JudgeOffer = { card: RebuttalCard | null; position: number; total: number };

	function applyOffer(offer: JudgeOffer | null) {
		if (!offer) {
			return;
		}
		if (!offer.card) {
			finishJudging();
			return;
		}
		card = offer.card;
		cardsSeen = Math.max(0, offer.position - 1);
		cardTotal = offer.total;
		showingCard = true;
		onJudgeCard(offer);
	}

	async function requestCard(action: {
		id: string;
		vote?: 'yes' | 'no';
		skip?: boolean;
	}): Promise<JudgeOffer | null> {
		const body = new FormData();
		body.set('player_id', playerId);
		body.set('tz', timezone);
		body.set('rebuttal_id', action.id);
		if (action.skip) {
			body.set('skip', '1');
		}
		if (action.vote) {
			body.set('vote', action.vote);
		}
		const response = await fetch('?/rebuttal', {
			method: 'POST',
			body,
			headers: {
				accept: 'application/json',
				'x-sveltekit-action': 'true'
			}
		});
		const result = deserialize(await response.text());
		if (result.type !== 'success' || !result.data || typeof result.data !== 'object') {
			return null;
		}
		const data = result.data as Record<string, unknown>;
		return {
			card: isRebuttalCard(data.card) ? data.card : null,
			position: typeof data.position === 'number' ? data.position : 0,
			total: typeof data.total === 'number' ? data.total : 0
		};
	}

	async function submitVote(choice: 'yes' | 'no') {
		if (!card || voting) {
			return;
		}
		voting = true;
		const currentId = card.id;
		try {
			applyOffer(await requestCard({ id: currentId, vote: choice }));
		} catch {
			// Keep the card that was already on screen.
		} finally {
			voting = false;
		}
	}

	async function skipCard() {
		if (!card || voting) {
			return;
		}
		const currentId = card.id;
		voting = true;
		try {
			applyOffer(await requestCard({ id: currentId, skip: true }));
		} catch {
			// Keep the card that was already on screen.
		} finally {
			voting = false;
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
		}
	}
</script>

<svelte:window on:keydown={onKeydown} />

{#snippet modeBadge(selected: boolean)}
	{#if $unseenRebuttals > 0}
		<span
			class="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] {selected
				? 'bg-light text-dark dark:bg-dark dark:text-light'
				: 'bg-dark text-light dark:bg-light dark:text-dark'}"
		>
			{$unseenRebuttals}
		</span>
	{/if}
{/snippet}

{#snippet scoreModes()}
	<div
		class="grid grid-cols-4 overflow-hidden rounded-full border border-gray-200 font-inter text-xs dark:border-gray-700"
	>
		{#each scoreModeList as mode, index (mode.id)}
			<button
				type="button"
				class="flex cursor-pointer items-center justify-center gap-1 px-1 py-2 {activeScoreMode ===
				mode.id
					? 'bg-dark text-light dark:bg-light dark:text-dark'
					: 'text-gray-400'} {index > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''}"
				aria-pressed={activeScoreMode === mode.id}
				on:click={() => selectScoreMode(mode.id)}
			>
				<span class="truncate">{mode.label}</span>
				{#if mode.id === 'rebuttals'}
					{@render modeBadge(activeScoreMode === 'rebuttals')}
				{/if}
			</button>
		{/each}
	</div>
{/snippet}

{#snippet voteDots(item: RebuttalInboxItem)}
	<span class="flex w-14 shrink-0 items-center justify-end gap-1 pt-1" aria-label="Votes">
		{#each voteOrder(item) as vote, i (i)}
			<span
				class="size-[0.39375rem] rounded-full {vote === 'yes' ? 'bg-green-500' : 'bg-red-500'}"
				aria-label={vote === 'yes' ? 'Yes' : 'No'}
			></span>
		{/each}
	</span>
{/snippet}

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
			class="relative z-10 grid max-h-[calc(100dvh-2rem)] w-full max-w-md min-w-0 overflow-hidden rounded-2xl bg-light shadow-2xl dark:bg-neutral-900"
			in:scale={{ duration: 220, start: 0.94, easing: cubicOut }}
			role="dialog"
			aria-modal="true"
			aria-labelledby={dialogLabel}
		>
			{#if showingCard && card}
				<div
					class="col-start-1 row-start-1 max-h-[calc(100dvh-2rem)] w-full min-w-0 overflow-x-clip overflow-y-auto px-6 py-7"
				>
					<div class="flex items-center justify-between">
						<p class="font-inter text-sm text-gray-400">
							{cardTotal > 0 ? `${cardsSeen + 1} of ${cardTotal}` : ''}
						</p>
						<div class="flex items-center gap-3">
							<button
								type="button"
								class="cursor-pointer font-inter text-sm text-gray-400 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
								disabled={!card || voting}
								on:click={skipCard}
							>
								Skip
							</button>
							<button
								type="button"
								class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
								aria-label="Close"
								on:click={close}
							>
								<svelte:component this={X} size={18} weight="bold" />
							</button>
						</div>
					</div>
					<div id="rebuttal-card-title" class="mt-8 space-y-2 text-center">
						<p class="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
							<span class="shrink-0 font-inter text-sm text-gray-400">Does</span>
							<span
								class="max-w-full font-['Instrument_Serif'] text-3xl leading-none wrap-break-word text-dark dark:text-light"
								>{card.answer}</span
							>
						</p>
						<p class="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
							<span class="shrink-0 font-inter text-sm text-gray-400">count for</span>
							<span
								class="max-w-full font-['Instrument_Serif'] text-3xl leading-none wrap-break-word text-dark dark:text-light"
								>{card.category}</span
							>
						</p>
					</div>
					<div class="mt-10 grid grid-cols-2 gap-3">
						<button
							type="button"
							class="cursor-pointer rounded-md border border-gray-300 p-3 font-inter text-base text-dark disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-light"
							disabled={voting}
							on:click={() => submitVote('no')}
						>
							No
						</button>
						<button
							type="button"
							class="cursor-pointer rounded-md bg-dark p-3 font-inter text-base text-light disabled:cursor-not-allowed disabled:opacity-50 dark:bg-light dark:text-dark"
							disabled={voting}
							on:click={() => submitVote('yes')}
						>
							Yes
						</button>
					</div>
				</div>
			{:else}
				{#key view}
					<div
						class="col-start-1 row-start-1 max-h-[calc(100dvh-2rem)] w-full min-w-0 overflow-x-clip overflow-y-auto px-6 py-7"
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
								{#if rebuttalsOnly}
									<div class="mb-1 flex items-center justify-between gap-3">
										<h2 id="rebuttals-only-title" class="text-2xl text-dark dark:text-light">
											Rebuttals
										</h2>
										<button
											type="button"
											class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
											aria-label="Close"
											on:click={close}
										>
											<svelte:component this={X} size={18} weight="bold" />
										</button>
									</div>
								{:else}
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
										<button
											type="button"
											class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
											aria-label="Close"
											on:click={close}
										>
											<svelte:component this={X} size={18} weight="bold" />
										</button>
									</div>

									<h2 id="scoreboard-title" class="sr-only">Scores</h2>
									<div class="mt-3">
										{@render scoreModes()}
									</div>
								{/if}

								<div class="mt-4 grid overflow-x-clip">
									{#key scoreChrome}
										<div
											class="col-start-1 row-start-1 min-w-0"
											in:fly|local={{
												x: paneSwitching ? paneDirection * 32 : 0,
												duration: paneSwitching ? 240 : 0,
												easing: cubicOut
											}}
											out:fly|local={{
												x: paneSwitching ? paneDirection * -32 : 0,
												duration: paneSwitching ? 220 : 0,
												easing: cubicOut
											}}
										>
											{#if scoreChrome === 'scores'}
												<div class="flex flex-wrap justify-evenly gap-x-2 gap-y-4 text-center">
													<div class="min-w-20 flex-1">
														<h2 class="m-0 text-5xl text-dark dark:text-light">{score}</h2>
														<p class="mt-1 text-xs tracking-widest text-gray-400 uppercase">
															Score
														</p>
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
												<div class="mt-8 grid overflow-x-clip">
													{#key scope}
														<div
															class="col-start-1 row-start-1"
															in:fly|local={{
																x: histogramSwitching ? paneDirection * 32 : 0,
																duration: histogramSwitching ? 240 : 0,
																easing: cubicOut
															}}
															out:fly|local={{
																x: histogramSwitching ? paneDirection * -32 : 0,
																duration: histogramSwitching ? 220 : 0,
																easing: cubicOut
															}}
														>
															<Histogram
																counts={activeCounts}
																highlight={score}
																variant="columns"
															/>
														</div>
													{/key}
												</div>
											{:else if scoreChrome === 'calendar'}
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
															<span
																class="flex h-9 items-center justify-center text-sm text-gray-400"
															>
																{cell.day}
															</span>
														{:else}
															<span class="h-9"></span>
														{/if}
													{/each}
												</div>
											{:else}
												<div
													bind:this={rebuttalScroller}
													data-rebuttal-scroll
													class="h-[40vh] overflow-y-auto pr-3 font-inter"
												>
													{#if rebuttalsLoaded && rebuttalItems.length === 0}
														<p
															class="flex h-full items-center justify-center px-10 text-center text-sm text-gray-400"
														>
															You haven't rebuttaled anything yet.
														</p>
													{:else}
														<div class="flex flex-col gap-4">
															{#each rebuttalItems as item, i (item.id)}
																<div
																	class="flex items-start justify-between gap-3 text-left"
																	use:loadWhenSeen={i === rebuttalItems.length - 2 &&
																		rebuttalHasMore}
																>
																	<div class="min-w-0">
																		<p class="text-base wrap-break-word text-dark dark:text-light">
																			{item.answer}
																		</p>
																		<p class="mt-1 text-xs wrap-break-word text-gray-400">
																			{item.category} · {formatRebuttalDate(item.createdAt)}
																		</p>
																	</div>
																	{@render voteDots(item)}
																</div>
															{/each}
														</div>
													{/if}
												</div>
											{/if}
										</div>
									{/key}
								</div>

								{#if !rebuttalsOnly}
									<div
										class="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-gray-400"
									>
										{#if dateLabel}
											<span>{dateLabel}</span>
											<span class="h-1.5 w-1.5 rounded-full bg-current"></span>
										{/if}
										<span>Play again tomorrow</span>
										<span class="h-1.5 w-1.5 rounded-full bg-current"></span>
										<button
											type="button"
											class="cursor-pointer text-gray-400 underline underline-offset-2 transition-all hover:underline-offset-4"
											on:click={() => showView('feedback', 1)}
										>
											Leave Feedback
										</button>
									</div>
								{/if}

								{#if errorMessage}
									<p class="mt-2 text-center text-sm text-red-600 dark:text-red-400">
										{errorMessage}
									</p>
								{/if}
							</form>
						{/if}
					</div>
				{/key}
			{/if}
		</div>
	</div>
{/if}
