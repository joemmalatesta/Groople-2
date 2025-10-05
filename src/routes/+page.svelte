<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';

	let input = '';
	const chat = new Chat({});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		chat.sendMessage({ text: input });
		input = '';
	}
</script>

<main class="mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold">AI Chat with Streaming</h1>

	<div class="mb-6 rounded-lg bg-white p-6 shadow-lg">
		<ul class="space-y-4">
			{#each chat.messages as message, messageIndex (messageIndex)}
				<li class="border-b pb-4 last:border-b-0">
					<div class="mb-2 text-sm font-semibold text-gray-600">
						{message.role === 'user' ? 'You' : 'AI'}
					</div>
					<div class="text-gray-800">
						{#each message.parts as part, partIndex (partIndex)}
							{#if part.type === 'text'}
								<div class="whitespace-pre-wrap">{part.text}</div>
							{/if}
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	</div>

	<form onsubmit={handleSubmit} class="flex gap-2">
		<input
			bind:value={input}
			placeholder="Type your message here..."
			class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
		/>
		<button
			type="submit"
			class="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Send
		</button>
	</form>
</main>
