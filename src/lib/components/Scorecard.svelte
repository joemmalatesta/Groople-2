<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import User from 'phosphor-svelte/lib/User';
	import Globe from 'phosphor-svelte/lib/Globe';
	import Fire from 'phosphor-svelte/lib/Fire';
	import LinkSimple from 'phosphor-svelte/lib/LinkSimple';
	import X from 'phosphor-svelte/lib/X';
	import Histogram from '$lib/components/Histogram.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import type { PlayerProfile } from '$lib/playerProfile';
	import { emptyHistogram, histogramTotal, includeScore, type ScoreboardStats } from '$lib/scoreboard';
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
	export let dateLabel = '';
	export let letter = '';
	export let correct: boolean[] = [];
	export let onClose: () => void = () => {};
	export let onSave: (player: PlayerProfile) => void = () => {};

	let scope: 'you' | 'world' = 'world';
	let nameValue = player?.name ?? '';
	let errorMessage = '';
	let copied = false;
	let formElement: HTMLFormElement;

	$: if (player) {
		nameValue = player.name ?? '';
	}

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
			window.setTimeout(() => {
				copied = false;
			}, 1600);
		} catch {
			errorMessage = 'Could not copy';
		}
	}

	function saveProfile() {
		writePlayerName(nameValue);
		formElement?.requestSubmit();
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
			class="relative z-10 w-full max-w-md rounded-2xl bg-light px-6 py-7 shadow-2xl dark:bg-neutral-900"
			in:scale={{ duration: 220, start: 0.94, easing: cubicOut }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="scoreboard-title"
		>
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
							class="min-w-0 w-full bg-transparent text-sm text-dark placeholder:text-gray-400 focus:outline-none dark:text-light"
						/>
					</label>
					<div class="flex rounded-full border border-gray-200 dark:border-gray-700">
						<Tooltip text="You" align="end" side="bottom">
							<button
								type="button"
								class="flex cursor-pointer items-center gap-1 rounded-l-full px-2.5 py-1 {scope === 'you'
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
								class="flex cursor-pointer items-center gap-1 rounded-r-full px-2.5 py-1 {scope === 'world'
									? 'bg-dark text-light dark:bg-light dark:text-dark'
									: 'text-gray-400'}"
								aria-label="World"
								on:click={() => (scope = 'world')}
							>
								<svelte:component this={Globe} size={14} weight="bold" />
							</button>
						</Tooltip>
					</div>
					<button
						type="button"
						class="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-dark dark:hover:bg-neutral-800 dark:hover:text-light"
						aria-label="Close"
						on:click={close}
					>
						<svelte:component this={X} size={18} weight="bold" />
					</button>
				</div>

				<div class="mt-4 grid grid-cols-3 gap-2 text-center">
					<div>
						<h2 id="scoreboard-title" class="m-0 text-5xl text-dark dark:text-light">{score}</h2>
						<p class="mt-1 text-xs uppercase tracking-widest text-gray-400">Score</p>
					</div>
					<div>
						<h2 class="m-0 text-5xl text-dark dark:text-light">{streak}</h2>
						<p
							class="mt-1 flex items-center justify-center gap-1 text-xs uppercase tracking-widest text-gray-400"
						>
							<svelte:component this={Fire} size={12} weight="fill" /> Streak
						</p>
					</div>
					<button
						type="button"
						class="cursor-pointer rounded-xl px-1 py-1 text-dark hover:bg-neutral-200/70 dark:text-light dark:hover:bg-neutral-800"
						aria-label="Share result"
						on:click={copyResult}
					>
						<span class="flex h-12 items-center justify-center">
							<svelte:component this={LinkSimple} size={36} weight="bold" />
						</span>
						<p class="mt-1 text-xs uppercase tracking-widest text-gray-400">
							{copied ? 'Copied' : 'Share'}
						</p>
					</button>
				</div>

				<div class="mt-8">
					<Histogram counts={activeCounts} highlight={score} variant="columns" />
				</div>

				<p class="mt-6 text-center text-sm text-gray-400">
					{#if dateLabel}
						{dateLabel}<span
							class="mx-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle"
						></span>
					{/if}Play again tomorrow
				</p>

				{#if errorMessage}
					<p class="mt-2 text-center text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
				{/if}
			</form>
		</div>
	</div>
{/if}
