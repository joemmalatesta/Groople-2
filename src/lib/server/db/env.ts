import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function isLocalDatabaseUrl(url: string): boolean {
	return url.includes('localhost') || url.includes('127.0.0.1');
}

function readDotenvDatabaseUrl(): string | null {
	const envPath = resolve(process.cwd(), '.env');
	if (!existsSync(envPath)) {
		return null;
	}

	for (const line of readFileSync(envPath, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
			continue;
		}
		const separator = trimmed.indexOf('=');
		if (trimmed.slice(0, separator) !== 'DATABASE_URL') {
			continue;
		}
		return trimmed.slice(separator + 1).replace(/^["']|["']$/g, '');
	}

	return null;
}

export function getDatabaseUrl(): string {
	const fromFile = readDotenvDatabaseUrl();
	const fromProcess = process.env.DATABASE_URL;

	if (fromFile && fromProcess && isLocalDatabaseUrl(fromProcess) && !isLocalDatabaseUrl(fromFile)) {
		return fromFile;
	}

	if (fromProcess) {
		return fromProcess;
	}

	if (fromFile) {
		return fromFile;
	}

	throw new Error('DATABASE_URL environment variable is not set');
}

export function isDirectRun(metaUrl: string): boolean {
	const entry = process.argv[1];
	if (!entry) {
		return false;
	}
	return metaUrl === pathToFileURL(resolve(entry)).href;
}
