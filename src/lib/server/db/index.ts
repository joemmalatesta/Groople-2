import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { getDatabaseUrl } from './env';

const client = postgres(getDatabaseUrl(), { prepare: false });

export const db = drizzle(client, { schema });
