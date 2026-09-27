import type { Handle } from '@sveltejs/kit';

const description = '12 categories. 100 seconds. Every answer starts with the same letter.';

function meta(origin: string): string {
	const image = `${origin}/og`;
	return `
<title>Groople</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Groople" />
<meta property="og:title" content="Groople" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${origin}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Groople" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
`;
}

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname !== '/' || event.request.method !== 'GET') {
		return resolve(event);
	}

	const tags = meta(event.url.origin);
	let injected = false;
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			if (injected || !html.includes('</head>')) {
				return html;
			}
			injected = true;
			return html.replace('</head>', `${tags}</head>`);
		}
	});
};
