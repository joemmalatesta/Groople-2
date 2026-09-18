import { defineConfig } from 'drizzle-kit';
import { getDatabaseUrl } from './src/lib/server/db/env';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: getDatabaseUrl() },
	verbose: true,
	strict: true
});
