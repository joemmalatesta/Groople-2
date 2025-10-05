import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

	return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
