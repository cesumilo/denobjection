import { isPromise } from './isPromise.ts';

// Map `arr` with `mapper` and after that return `returnValue`. If none of
// the mapped values is a promise, return synchronously for performance
// reasons.
export function mapAfterAllReturn<T, U>(
	arr: T[],
	mapper: (arg: T) => unknown | Promise<unknown>,
	returnValue: U,
): U | Promise<U> {
	const results: unknown[] = [];
	let containsPromise = false;

	for (let i = 0, l = arr.length; i < l; ++i) {
		results.push(mapper(arr[i]));

		if (isPromise(results[i])) {
			containsPromise = true;
		}
	}

	if (containsPromise) {
		return Promise.all(results).then(() => returnValue);
	} else {
		return returnValue;
	}
}
