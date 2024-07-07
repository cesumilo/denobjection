type MapOptions = {
	concurrency?: number;
};
type ArrayMapper<T, U = unknown> = (item: T, index: number) => Promise<U> | U;

// Works like Bluebird.map.
export function promiseMap<T, U = unknown>(
	items: T[],
	mapper: ArrayMapper<T, U>,
	opt?: MapOptions,
): Promise<U[]> {
	switch (items.length) {
		case 0:
			return mapZero();
		case 1:
			return mapOne(items, mapper);
		default:
			return mapMany(items, mapper, opt);
	}
}

function mapZero() {
	return Promise.resolve([]);
}

async function mapOne<T, U = unknown>(items: T[], mapper: ArrayMapper<T, U>) {
	return [await mapper(items[0], 0)];
}

async function mapMany<T, U = unknown>(
	items: T[],
	mapper: ArrayMapper<T, U>,
	opt?: MapOptions,
) {
	const concurrency = opt?.concurrency || Number.MAX_SAFE_INTEGER;

	const results: U[][] = [];
	for (let i = 0; i < items.length; i += concurrency) {
		results.push(
			await Promise.all(
				items.slice(i, i + concurrency).map((x, idx) => mapper(x, idx)),
			),
		);
	}

	return results.flat();
}
