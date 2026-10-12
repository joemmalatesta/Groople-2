export const displayFilterFocus =
	'Judge the wording only. Flag a slur for a group of people. Also flag a word whose ordinary use is to demean or address a person, such as bitch, cunt, or whore. Do not flag swearing that is not a name for someone. Do not flag a body part, a piece of clothing, or an acronym.';

export const displayFilterCriteria = {
	true: {
		what: 'It is a slur for a group of people, or a demeaning word used to call a person.'
	},
	false: {
		what: 'It is ordinary swearing, a body part, clothing, or an acronym, and people do not use it as a name for someone.'
	}
};
