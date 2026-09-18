export function localDateInTimezone(timeZone: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: timeZone || 'UTC',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}
