import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';

export function createClient(event: RequestEvent) {
	const supabaseUrl = process.env.VITE_SUPABASE_URL;
	const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		console.warn('Supabase URL or Anon Key not found. Please check your environment variables.');
		// Return a mock client to prevent errors
		return {
			from: () => ({
				select: () => ({ data: [], error: { message: 'Supabase not configured' } })
			}),
			auth: {
				getSession: () => Promise.resolve({ data: { session: null }, error: null })
			}
		} as any;
	}

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, options);
				});
			}
		}
	});
}
