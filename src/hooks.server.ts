import type { Handle } from '@sveltejs/kit';
import { SHARE_URL } from '$lib/shareResult';

const card = `${SHARE_URL}/og`;

const meta = `
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Groople" />
<meta property="og:title" content="Groople" />
<meta property="og:description" content="12 categories. 100 seconds. One letter." />
<meta property="og:url" content="${SHARE_URL}" />
<meta property="og:image" content="${card}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Groople" />
<meta name="twitter:description" content="12 categories. 100 seconds. One letter." />
<meta name="twitter:image" content="${card}" />
`;

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname !== '/' || event.request.method !== 'GET') {
		return resolve(event);
	}

	let injected = false;
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			if (injected || !html.includes('</head>')) {
				return html;
			}
			injected = true;
			return html.replace('</head>', `${meta}</head>`);
		}
	});
};
