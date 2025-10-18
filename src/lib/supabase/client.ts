import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
	// Hardcoded values for development (not using Supabase currently)
	const supabaseUrl = 'https://placeholder.supabase.co';
	const supabaseAnonKey = 'placeholder-anon-key';

	// Return a mock client since we're not using Supabase
	return {
		from: () => ({
			select: () => ({ data: [], error: null }),
			insert: () => ({ data: [], error: null }),
			update: () => ({ data: [], error: null }),
			delete: () => ({ data: [], error: null })
		}),
		auth: {
			getSession: () => Promise.resolve({ data: { session: null }, error: null }),
			signIn: () => Promise.resolve({ data: { user: null }, error: null }),
			signOut: () => Promise.resolve({ error: null })
		}
	} as any;
}
