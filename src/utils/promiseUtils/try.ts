// Works like Bluebird.try.
export async function promiseTry<T>(callback: () => T | Promise<T>) {
	return await callback();
}
