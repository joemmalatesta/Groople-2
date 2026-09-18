export function startsWithRequiredLetter(answer: string, letter: string): boolean {
	const trimmed = answer.trim();
	const required = letter.trim();
	if (!trimmed || !required) {
		return false;
	}

	const firstChar = trimmed[0];
	const requiredChar = required[0];
	if (!firstChar || !requiredChar) {
		return false;
	}

	return firstChar.toLowerCase() === requiredChar.toLowerCase();
}
