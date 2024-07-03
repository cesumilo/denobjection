export function isFunction(
    value: unknown,
): value is (...args: unknown[]) => unknown {
    return typeof value === "function";
}
export type GenericRecord<T = unknown | unknown[]> = Record<Key, T>;
export function isSafeKey(key: unknown): key is string | number {
    return isNumber(key) || (isString(key) && key !== "__proto__");
}
export function isObject(value: unknown): boolean {
    return value !== null && typeof value === "object";
}
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

export function set(
    obj: GenericRecord,
    path: (string | number)[],
    value: unknown,
): GenericRecord {
    const inputObj = obj;
    let currentValue: GenericRecord | unknown[] = obj;

    for (let i = 0, l = path.length - 1; i < l; ++i) {
        const key = path[i];

        if (!isSafeKey(key)) {
            return inputObj;
        }

        let child: GenericRecord | unknown[] =
            (currentValue as GenericRecord)[key] as GenericRecord | unknown[];

        if (!isObject(child)) {
            const nextKey = path[i + 1];

            if (isNaN(Number(nextKey))) {
                child = {} as GenericRecord;
            } else {
                child = [] as unknown[];
            }

            (currentValue as GenericRecord)[key] = child;
        }

        currentValue = child;
    }

    if (path.length > 0 && isObject(currentValue)) {
        const key = path[path.length - 1];

        if (isSafeKey(key)) {
            if (typeof key === "number") {
                (currentValue as unknown[])[key] = value;
            } else {
                (currentValue as GenericRecord)[key] = value;
            }
        }
    }

    return inputObj;
}

console.log(isFunction(null));
console.log(isFunction(() => console.log("oui")));

console.log(set({}, ["foo", 1], "bar"));
