import { isFunction, isObject } from '../object.ts';

export function isPromise(obj: unknown): obj is Promise<unknown> {
	// TODO maybe just use `return obj instanceof Promise;`
	return isObject(obj) && isFunction(obj.then);
}
