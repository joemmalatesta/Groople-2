import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const SEEN_KEY = 'groople_rebuttals_seen';

export type RebuttalInboxItem = {
	id: string;
	answer: string;
	category: string;
	yes: number;
	no: number;
	status: 'open' | 'yes' | 'no';
	createdAt: string;
	/** Votes in the order they were cast. */
	votes?: Array<'yes' | 'no'>;
};

export type RebuttalInboxPage = {
	items: RebuttalInboxItem[];
	nextCursor: string | null;
};

export const unseenRebuttals = writable(0);

let decidedIds: string[] = [];

export function voteOrder(item: RebuttalInboxItem): Array<'yes' | 'no'> {
	if (item.votes) {
		return item.votes;
	}
	return [
		...Array.from({ length: item.yes }, () => 'yes' as const),
		...Array.from({ length: item.no }, () => 'no' as const)
	];
}

function readSeen(): string[] {
	if (!browser) {
		return [];
	}
	try {
		const raw = localStorage.getItem(SEEN_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
	} catch {
		return [];
	}
}

export function setDecidedRebuttalIds(ids: string[]) {
	decidedIds = ids.filter((id) => typeof id === 'string');
	unseenRebuttals.set(decidedIds.filter((id) => !readSeen().includes(id)).length);
}

export function markRequestedRebuttalsSeen() {
	if (!browser) {
		return;
	}
	localStorage.setItem(SEEN_KEY, JSON.stringify(decidedIds));
	unseenRebuttals.set(0);
}

export function formatRebuttalDate(createdAt: string): string {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) {
		return createdAt;
	}
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isVote(value: unknown): value is 'yes' | 'no' {
	return value === 'yes' || value === 'no';
}

function isInboxItem(value: unknown): value is RebuttalInboxItem {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const item = value as Partial<RebuttalInboxItem>;
	return (
		typeof item.id === 'string' &&
		typeof item.answer === 'string' &&
		typeof item.category === 'string' &&
		typeof item.yes === 'number' &&
		typeof item.no === 'number' &&
		(item.status === 'open' || item.status === 'yes' || item.status === 'no') &&
		typeof item.createdAt === 'string' &&
		Array.isArray(item.votes) &&
		item.votes.every(isVote)
	);
}

export async function fetchRebuttalInbox(params: {
	playerId: string;
	cursor: string | null;
}): Promise<RebuttalInboxPage> {
	const empty: RebuttalInboxPage = { items: [], nextCursor: null };
	try {
		const response = await fetch('/api/rebuttal-inbox', {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				playerId: params.playerId,
				cursor: params.cursor
			})
		});
		if (!response.ok) {
			return empty;
		}
		const body: unknown = await response.json();
		if (!body || typeof body !== 'object') {
			return empty;
		}
		const page = body as Partial<RebuttalInboxPage>;
		if (!Array.isArray(page.items) || !page.items.every(isInboxItem)) {
			return empty;
		}
		return {
			items: page.items,
			nextCursor: typeof page.nextCursor === 'string' ? page.nextCursor : null
		};
	} catch {
		return empty;
	}
}
