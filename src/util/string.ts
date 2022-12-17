export function titleCase(title: string): string {
	return title[0].toUpperCase() + title.slice(1);
}

const formatter = Intl.NumberFormat('en', {
	notation: 'compact',
	style: 'currency',
	currency: 'USD',
});

export function compactNumber(number: number): string {
	return formatter.format(number);
}

export function compactNumberAll(number: number): string {
	if (number < 1000) {
		return number.toString();
	} else if (number > 1000 && number < 1000000) {
		return (number / 1000).toFixed(1) + 'k';
	} else if (number > 1000000 && number < 1000000000) {
		return (number / 1000000000).toFixed(1) + 'm';
	} else if (number > 1000000000 && number < 1000000000000) {
		return (number / 1000000000000).toFixed(1) + 'b';
	} else if (number > 1000000000000 && number < 1000000000000000) {
		return (number / 1000000000000000).toFixed(1) + 't';
	}

	return number.toString();
}
