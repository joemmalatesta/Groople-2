export function isValidTimeZone(timeZone: string): boolean {
	if (!timeZone) {
		return false;
	}

	try {
		Intl.DateTimeFormat('en-US', { timeZone });
		return true;
	} catch {
		return false;
	}
}

export function localDateInTimezone(timeZone: string): string {
	if (!isValidTimeZone(timeZone)) {
		throw new Error('Invalid timezone');
	}

	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}
