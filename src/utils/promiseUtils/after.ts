import { isPromise } from './isPromise.ts';

// Call `func` after `obj` has been resolved. Call `func` synchronously if
// `obj` is not a promise for performance reasons.
export function after<T, U>(
	obj: T | Promise<T>,
	func: (arg: T) => U,
): Promise<U> | U {
	if (isPromise(obj)) {
		return obj.then(func);
	} else {
		return func(obj);
	}
}
