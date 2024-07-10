// deno-lint-ignore-file no-explicit-any
// const { clone, cloneDeep } = require('./clone');
const SMALL_ARRAY_SIZE = 10;

export type Key = string | number | symbol;
export type GenericRecord<T = unknown | unknown[]> = Record<Key, T>;

export function isBuffer(item: unknown): item is Deno.Buffer {
	return item instanceof Deno.Buffer;
}

export function isEmpty(item: unknown): boolean {
	if (Array.isArray(item) || isBuffer(item)) {
		return item.length === 0;
	} else if (isObject(item)) {
		return Object.keys(item as GenericRecord<never>)
			.length === 0;
	} else {
		return true;
	}
}

export function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value == 'object';
}

export function isPlainObject(
	value: unknown,
): value is GenericRecord {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		!(value instanceof Date) &&
		!(value instanceof Function)
	);
}

export function isFunction(
	value: unknown,
): value is (...args: unknown[]) => unknown {
	return typeof value === 'function';
}

export function isRegExp(value: unknown): value is RegExp {
	return value instanceof RegExp;
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number';
}

export function asArray<T = unknown>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
}

export function asSingle<T = unknown>(value: T | T[]): T {
	return Array.isArray(value) ? value[0] : value;
}

export function uniqBy<T = unknown>(
	items: T[],
	keyGetter: ((arg0: T) => string) | null = null,
) {
	const map = new Map();

	for (let i = 0, l = items.length; i < l; ++i) {
		const item = items[i];
		const key = keyGetter !== null ? keyGetter(item) : item;

		map.set(key, item);
	}

	return Array.from(map.values());
}

export function groupBy<T = unknown>(
	items: (T | Key)[],
	keyGetter: ((arg0: T) => Key) | null = null,
): Map<Key, (T | Key)[]> {
	const groups = new Map<Key, (T | Key)[]>();

	for (const item of items) {
		const key = (keyGetter !== null ? keyGetter(item as T) : item) as Key;
		let group = groups.get(key);

		if (!group) {
			group = [];
			groups.set(key, group);
		}

		group.push(item);
	}

	return groups;
}

export function omit<T = unknown>(
	obj: GenericRecord<T>,
	keysToOmit: Key | Key[],
): GenericRecord<T> {
	keysToOmit = asArray(keysToOmit);

	const keys = Object.keys(obj);
	const out = {} as GenericRecord<T>;

	for (let i = 0, l = keys.length; i < l; ++i) {
		const key = keys[i];

		if (!keysToOmit.includes(key)) {
			out[key] = obj[key];
		}
	}

	return out;
}

export function difference<T = unknown>(arr1: T[], arr2: T[]): T[] {
	const arr2Set = new Set(arr2);
	const diff = [];

	for (let i = 0; i < arr1.length; ++i) {
		const value = arr1[i];

		if (!arr2Set.has(value)) {
			diff.push(value);
		}
	}

	return diff;
}

export function union<T = unknown>(arr1: T[], arr2: T[]) {
	if (arr1.length < SMALL_ARRAY_SIZE && arr2.length < SMALL_ARRAY_SIZE) {
		return unionSmall(arr1, arr2);
	} else {
		return unionGeneric(arr1, arr2);
	}
}

export function unionSmall<T = unknown>(arr1: T[], arr2: T[]): T[] {
	const all = arr1.slice();

	for (let i = 0, l = arr2.length; i < l; ++i) {
		const item = arr2[i];

		if (all.indexOf(item) === -1) {
			all.push(item);
		}
	}

	return all;
}

export function unionGeneric<T = unknown>(arr1: T[], arr2: T[]): T[] {
	const all = new Set<T>();

	for (let i = 0; i < arr1.length; ++i) {
		all.add(arr1[i]);
	}

	for (let i = 0; i < arr2.length; ++i) {
		all.add(arr2[i]);
	}

	return Array.from(all);
}

export function last<T = unknown>(arr: T[]): T {
	return arr[arr.length - 1];
}

export function upperFirst(str: string): string {
	return str[0].toUpperCase() + str.substring(1);
}

export function values<T = unknown>(obj: unknown): T[] {
	if (isObject(obj)) {
		const rec = obj as GenericRecord<T>;
		const keys = Object.keys(rec);
		const values = new Array(keys.length);

		for (let i = 0, l = keys.length; i < l; ++i) {
			values[i] = rec[keys[i]];
		}

		return values;
	} else {
		return [];
	}
}

export function once<T = unknown>(
	this: any,
	func: (...args: any[]) => T,
): (...args: any[]) => T {
	let called = false;
	let value: T;

	return (...args: any[]): T => {
		if (called === false) {
			called = true;
			value = func.apply(this, args);
		}

		return value;
	};
}

export function flatten<T = unknown>(arrays: (T | T[])[]): T[] {
	return arrays.flat() as T[];
}

export function get<T = unknown>(obj: unknown, path: Key[]): T | undefined {
	for (let i = 0, l = path.length; i < l; ++i) {
		const key = path[i];

		if (!isObject(obj)) {
			return undefined;
		}

		if (Array.isArray(obj) && !isNaN(Number(key))) {
			obj = obj[Number(key)];
		} else {
			const rec = obj as GenericRecord<T>;
			obj = rec[key];
		}
	}

	return obj as T;
}

export function set(
	obj: GenericRecord | unknown[],
	path: Key[],
	value: unknown,
): GenericRecord | unknown[] {
	const inputObj = obj;
	let currentValue: GenericRecord | unknown[] = obj;

	for (let i = 0, l = path.length - 1; i < l; ++i) {
		const key = path[i];

		if (!isSafeKey(key)) {
			return inputObj;
		}

		let child: GenericRecord | unknown =
			Array.isArray(currentValue) && !isNaN(Number(key))
				? currentValue[Number(key)]
				: (currentValue as GenericRecord)[key];

		if (!isObject(child)) {
			const nextKey = path[i + 1];

			if (isNaN(Number(nextKey))) {
				child = {} as GenericRecord;
			} else {
				child = [] as unknown[];
			}

			(currentValue as GenericRecord)[key] = child;
		}

		currentValue = child as (GenericRecord | unknown[]);
	}

	if (path.length > 0 && isObject(currentValue)) {
		const key = path[path.length - 1];

		if (isSafeKey(key)) {
			if (!isNaN(Number(key))) {
				// TODO: wtf about typing here?
				(currentValue as unknown as unknown[])[Number(key)] = value;
			} else {
				(currentValue as GenericRecord)[key] = value;
			}
		}
	}

	return inputObj;
}

export function zipObject<T = unknown>(
	keys: Key[],
	values: T[],
): GenericRecord<T> {
	const out = {} as GenericRecord<T>;

	for (let i = 0, l = keys.length; i < l; ++i) {
		const key = keys[i];

		if (isSafeKey(key)) {
			out[key] = values[i];
		}
	}

	return out;
}

export function chunk<T = unknown>(arr: T[], chunkSize: number): T[][] {
	const out: T[][] = [];

	if (chunkSize <= 0) {
		return out;
	}

	for (let i = 0, l = arr.length; i < l; ++i) {
		const item = arr[i];

		if (out.length === 0 || out[out.length - 1].length === chunkSize) {
			out.push([]);
		}

		out[out.length - 1].push(item);
	}

	return out;
}

export function jsonEquals(val1: unknown, val2: unknown): boolean {
	return jsonEqualsBase(val1, val2, compareStrict);
}

export function jsonEqualsBase(
	val1: unknown,
	val2: unknown,
	compare: (arg0: unknown, arg1: unknown) => boolean,
) {
	if (val1 === val2) {
		return true;
	}

	return jsonEqualsSlowPath(val1, val2, compare);
}

export function jsonEqualsSlowPath(
	val1: unknown,
	val2: unknown,
	compare: (arg0: unknown, arg1: unknown) => boolean,
): boolean {
	const type1 = typeof val1;
	const type2 = typeof val2;

	const isNonNullObject1 = type1 === 'object' && !compare(val1, null);
	const isNonNullObject2 = type2 === 'object' && !compare(val2, null);

	if (isNonNullObject1 && isNonNullObject2) {
		const isArray1 = Array.isArray(val1);
		const isArray2 = Array.isArray(val2);

		if (isArray1 && isArray2) {
			return jsonEqualsArray(val1, val2, compare);
		} else if (!isArray1 && !isArray2) {
			return jsonEqualsObject(val1, val2, compare);
		} else {
			return false;
		}
	} else if (isNonNullObject1 !== isNonNullObject2) {
		return false;
	} else {
		return compare(val1, val2);
	}
}

export function jsonEqualsArray(
	arr1: unknown[],
	arr2: unknown[],
	compare: (arg0: unknown, arg1: unknown) => boolean,
): boolean {
	if (arr1.length !== arr2.length) {
		return false;
	}

	for (let i = 0, l = arr1.length; i < l; ++i) {
		if (!jsonEqualsBase(arr1[i], arr2[i], compare)) {
			return false;
		}
	}

	return true;
}

export function jsonEqualsObject(
	obj1: unknown,
	obj2: unknown,
	compare: (arg0: unknown, arg1: unknown) => boolean,
) {
	if (obj1 instanceof Date && obj2 instanceof Date) {
		return equalsDate(obj1, obj2);
	}

	const keys1 = Object.keys(obj1 as GenericRecord);
	const keys2 = Object.keys(obj2 as GenericRecord);

	if (keys1.length !== keys2.length) {
		return false;
	}

	for (let i = 0, l = keys1.length; i < l; ++i) {
		const key = keys1[i];

		if (
			!jsonEqualsBase(
				(obj1 as GenericRecord)[key],
				(obj2 as GenericRecord)[key],
				compare,
			)
		) {
			return false;
		}
	}

	return true;
}

export function equalsDate(date1: Date, date2: Date): boolean {
	return date1.getTime() === date2.getTime();
}

export function compareStrict(val1: unknown, val2: unknown): boolean {
	return val1 === val2;
}

export function isSafeKey(key: unknown): key is string | number {
	return isNumber(key) || (isString(key) && key !== '__proto__');
}

export function mergeMaps<K = unknown, V = unknown>(
	map1: Map<K, V>,
	map2: Map<K, V>,
): Map<K, V> {
	const map = new Map<K, V>(map1);

	if (map2) {
		for (const key of map2.keys()) {
			map.set(key, map2.get(key) as V);
		}
	}

	return map;
}

export function clone<T>(value: T): T {
	if (value === null || typeof value !== 'object') {
		return value;
	}

	if (Array.isArray(value)) {
		return [...value] as unknown as T;
	}

	if (value instanceof Date) {
		return new Date(value.getTime()) as unknown as T;
	}

	if (value instanceof Map) {
		return new Map(value) as unknown as T;
	}

	if (value instanceof Set) {
		return new Set(value) as unknown as T;
	}

	if (value instanceof Deno.Buffer) {
		return new Deno.Buffer(new Uint8Array(value.bytes())) as unknown as T;
	}

	if (value instanceof Object) {
		return { ...value } as T;
	}

	throw new Error('Unsupported data type');
}

export function cloneDeep<T>(value: T): T {
	if (value === null || typeof value !== 'object') {
		return value;
	}

	if (value instanceof Date) {
		return new Date(value.getTime()) as unknown as T;
	}

	if (Array.isArray(value)) {
		const arrCopy: any[] = [];
		for (const item of value) {
			arrCopy.push(cloneDeep(item));
		}
		return arrCopy as unknown as T;
	}

	if (value instanceof Map) {
		const mapCopy = new Map();
		value.forEach((val, key) => {
			mapCopy.set(key, cloneDeep(val));
		});
		return mapCopy as unknown as T;
	}

	if (value instanceof Set) {
		const setCopy = new Set();
		value.forEach((item) => {
			setCopy.add(cloneDeep(item));
		});
		return setCopy as unknown as T;
	}

	if (value instanceof Deno.Buffer) {
		return new Deno.Buffer(new Uint8Array(value.bytes())) as unknown as T;
	}

	if (value instanceof Object) {
		const objCopy: { [key: string]: any } = {};
		for (const key in value) {
			// deno-lint-ignore no-prototype-builtins
			if (value.hasOwnProperty(key)) {
				objCopy[key] = cloneDeep((value as { [key: string]: any })[key]);
			}
		}
		return objCopy as T;
	}

	throw new Error('Unsupported data type');
}
