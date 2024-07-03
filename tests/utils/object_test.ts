import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
    asArray,
    asSingle,
    difference,
    groupBy,
    isBuffer,
    isEmpty,
    isFunction,
    isNumber,
    isObject,
    isPlainObject,
    isRegExp,
    isString,
    omit,
    uniqBy,
} from "../../src/utils/object.ts";

Deno.test("isBuffer", async (t) => {
    await t.step("should return true for a Buffer instance", () => {
        const buffer = new Deno.Buffer(new Uint8Array([1, 2, 3]));
        assertEquals(isBuffer(buffer), true);
    });

    await t.step("should return false for a non-Buffer object", () => {
        const notBuffer = {};
        assertEquals(isBuffer(notBuffer), false);
    });

    await t.step("should return false for null", () => {
        assertEquals(isBuffer(null), false);
    });

    await t.step("should return false for undefined", () => {
        assertEquals(isBuffer(undefined), false);
    });

    await t.step("should return false for a number", () => {
        assertEquals(isBuffer(42), false);
    });

    await t.step("should return false for a string", () => {
        assertEquals(isBuffer("string"), false);
    });

    await t.step("should return false for an array", () => {
        assertEquals(isBuffer([1, 2, 3]), false);
    });
});

Deno.test("isEmpty", async (t) => {
    await t.step("should return true for empty array", () => {
        assertEquals(isEmpty([]), true);
    });

    await t.step("should return false for non-empty array", () => {
        assertEquals(isEmpty([1, 2, 3]), false);
    });

    await t.step("should return true for empty object", () => {
        assertEquals(isEmpty({}), true);
    });

    await t.step("should return false for non-empty object", () => {
        assertEquals(isEmpty({ key: "value" }), false);
    });

    await t.step("should return true for empty Buffer", () => {
        assertEquals(isEmpty(new Deno.Buffer(new Uint8Array())), true);
    });

    await t.step("should return false for non-empty Buffer", () => {
        assertEquals(
            isEmpty(new Deno.Buffer(new Uint8Array([1, 2, 3]))),
            false,
        );
    });

    await t.step("should return true for null", () => {
        assertEquals(isEmpty(null), true);
    });

    await t.step("should return true for undefined", () => {
        assertEquals(isEmpty(undefined), true);
    });

    await t.step("should return true for number", () => {
        assertEquals(isEmpty(42), true);
    });

    await t.step("should return true for string", () => {
        assertEquals(isEmpty("hello"), true);
    });
});

Deno.test("isObject", async (t) => {
    await t.step("should return true for plain object", () => {
        assertEquals(isObject({}), true);
    });

    await t.step("should return true for non-null object", () => {
        assertEquals(isObject(new Date()), true);
    });

    await t.step("should return false for null", () => {
        assertEquals(isObject(null), false);
    });

    await t.step("should return false for undefined", () => {
        assertEquals(isObject(undefined), false);
    });

    await t.step("should return false for number", () => {
        assertEquals(isObject(42), false);
    });

    await t.step("should return false for string", () => {
        assertEquals(isObject("hello"), false);
    });

    await t.step("should return false for boolean", () => {
        assertEquals(isObject(true), false);
    });

    await t.step("should return true for array", () => {
        assertEquals(isObject([1, 2, 3]), true);
    });

    await t.step("should return false for function", () => {
        assertEquals(isObject(() => {}), false);
    });
});

Deno.test("isPlainObject", async (t) => {
    await t.step("should return true for plain object", () => {
        assertEquals(isPlainObject({}), true);
    });

    await t.step("should return true for non-null object", () => {
        assertEquals(isPlainObject(new Date()), false);
    });

    await t.step("should return false for null", () => {
        assertEquals(isPlainObject(null), false);
    });

    await t.step("should return false for undefined", () => {
        assertEquals(isPlainObject(undefined), false);
    });

    await t.step("should return false for number", () => {
        assertEquals(isPlainObject(42), false);
    });

    await t.step("should return false for string", () => {
        assertEquals(isPlainObject("hello"), false);
    });

    await t.step("should return false for boolean", () => {
        assertEquals(isPlainObject(true), false);
    });

    await t.step("should return false for array", () => {
        assertEquals(isPlainObject([1, 2, 3]), false);
    });

    await t.step("should return false for function", () => {
        assertEquals(isPlainObject(() => {}), false);
    });
});

Deno.test("isFunction", async (t) => {
    await t.step("should return true for function", () => {
        assertEquals(isFunction(() => {}), true);
    });

    await t.step("should return false for non-function values", () => {
        assertEquals(isFunction({}), false);
        assertEquals(isFunction([]), false);
        assertEquals(isFunction(42), false);
        assertEquals(isFunction("hello"), false);
        assertEquals(isFunction(null), false);
        assertEquals(isFunction(undefined), false);
        assertEquals(isFunction(new Date()), false);
    });
});

Deno.test("isRegExp", async (t) => {
    await t.step("should return true for RegExp object", () => {
        assertEquals(isRegExp(/test/), true);
    });

    await t.step("should return false for non-RegExp values", () => {
        assertEquals(isRegExp({}), false);
        assertEquals(isRegExp([]), false);
        assertEquals(isRegExp(42), false);
        assertEquals(isRegExp("hello"), false);
        assertEquals(isRegExp(null), false);
        assertEquals(isRegExp(undefined), false);
        assertEquals(isRegExp(new Date()), false);
        assertEquals(isRegExp(() => {}), false);
    });
});

Deno.test("isString", async (t) => {
    await t.step("should return true for string value", () => {
        assertEquals(isString("foo"), true);
    });

    await t.step("should return false for non-string values", () => {
        assertEquals(isString({}), false);
        assertEquals(isString([]), false);
        assertEquals(isString(42), false);
        assertEquals(isString(/test/), false);
        assertEquals(isString(null), false);
        assertEquals(isString(undefined), false);
        assertEquals(isString(new Date()), false);
        assertEquals(isString(() => {}), false);
    });
});

Deno.test("isNumber", async (t) => {
    await t.step("should return true for number value", () => {
        assertEquals(isNumber(42), true);
    });

    await t.step("should return false for non-number values", () => {
        assertEquals(isNumber({}), false);
        assertEquals(isNumber([]), false);
        assertEquals(isNumber("foo"), false);
        assertEquals(isNumber(/test/), false);
        assertEquals(isNumber(null), false);
        assertEquals(isNumber(undefined), false);
        assertEquals(isNumber(new Date()), false);
        assertEquals(isNumber(() => {}), false);
    });
});

Deno.test("asArray", async (t) => {
    await t.step("should return array when given a single value", () => {
        assertEquals(asArray(42), [42]);
        assertEquals(asArray("hello"), ["hello"]);
        assertEquals(asArray(null), [null]);
        assertEquals(asArray(undefined), [undefined]);
        assertEquals(asArray({}), [{}]);
        assertEquals(asArray(new Date()), [new Date()]);
        const f = () => {};
        assertEquals(asArray(f), [f]);
    });

    await t.step("should return the same array when given an array", () => {
        assertEquals(asArray([1, 2, 3]), [1, 2, 3]);
        assertEquals(asArray(["a", "b", "c"]), ["a", "b", "c"]);
        assertEquals(asArray([null]), [null]);
        assertEquals(asArray([undefined]), [undefined]);
        assertEquals(asArray([{}]), [{}]);
        assertEquals(asArray([new Date()]), [new Date()]);
        const f = () => {};
        assertEquals(asArray([f]), [f]);
    });
});

Deno.test("asSingle", async (t) => {
    await t.step("should return single value when given a single value", () => {
        assertEquals(asSingle(42), 42);
        assertEquals(asSingle("hello"), "hello");
        assertEquals(asSingle(null), null);
        assertEquals(asSingle(undefined), undefined);
        assertEquals(asSingle({}), {});
        assertEquals(asSingle(new Date()), new Date());
        const fn = () => {};
        assertEquals(asSingle(fn), fn);
    });

    await t.step(
        "should return the first element of the array when given an array",
        () => {
            assertEquals(asSingle([1, 2, 3]), 1);
            assertEquals(asSingle(["a", "b", "c"]), "a");
            assertEquals(asSingle([null]), null);
            assertEquals(asSingle([undefined]), undefined);
            assertEquals(asSingle([{}]), {});
            assertEquals(asSingle([new Date()]), new Date());
            const fnArray = [() => {}, () => {}];
            assertEquals(asSingle(fnArray), fnArray[0]);
        },
    );
});

Deno.test("uniqBy", async (t) => {
    await t.step("should remove duplicates based on keyGetter function", () => {
        const items = [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
            { id: 1, name: "Alice" }, // Duplicate based on id
            { id: 3, name: "Charlie" },
        ];

        const result = uniqBy(items, (item) => item.id.toString());

        assertEquals(result.length, 3);
        assertEquals(result[0], { id: 1, name: "Alice" });
        assertEquals(result[1], { id: 2, name: "Bob" });
        assertEquals(result[2], { id: 3, name: "Charlie" });
    });

    await t.step(
        "should handle keyGetter as null and remove exact duplicates",
        () => {
            const items = [1, 2, 3, 1, 4, 2, 5, 3, 6]; // Array with duplicates

            const result = uniqBy(items);

            assertEquals(result.length, 6);
            assertEquals(result, [1, 2, 3, 4, 5, 6]);
        },
    );

    await t.step(
        "should preserve order of first occurrences when keyGetter is null",
        () => {
            const items = [1, 2, 3, 2, 1, 4, 3, 5, 4]; // Array with duplicates

            const result = uniqBy(items);

            assertEquals(result.length, 5);
            assertEquals(result, [1, 2, 3, 4, 5]);
        },
    );
});

Deno.test("groupBy", async (t) => {
    await t.step("should group items based on keyGetter function", () => {
        const items = [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
            { id: 3, name: "Charlie" },
            { id: 1, name: "Dave" },
            { id: 2, name: "Eve" },
            { id: 3, name: "Frank" },
        ];

        const result = groupBy(items, (item) => item.id.toString());

        assertEquals(result.size, 3);

        assertEquals(result.get("1"), [
            { id: 1, name: "Alice" },
            { id: 1, name: "Dave" },
        ]);

        assertEquals(result.get("2"), [
            { id: 2, name: "Bob" },
            { id: 2, name: "Eve" },
        ]);

        assertEquals(result.get("3"), [
            { id: 3, name: "Charlie" },
            { id: 3, name: "Frank" },
        ]);
    });

    await t.step(
        "should handle keyGetter as null and group items by identity",
        () => {
            const items = [1, 2, 3, 1, 2, 3, 4];

            const result = groupBy(items);

            assertEquals(result.size, 4);

            assertEquals(result.get(1), [1, 1]);
            assertEquals(result.get(2), [2, 2]);
            assertEquals(result.get(3), [3, 3]);
            assertEquals(result.get(4), [4]);
        },
    );
});

Deno.test("omit", async (t) => {
    await t.step("should specified keys from object", () => {
        const obj = {
            id: 1,
            name: "Alice",
            age: 30,
        };

        const result = omit(obj, ["id", "age"]);

        assertEquals(result, { name: "Alice" });
    });

    await t.step("should handle single key to omit", () => {
        const obj = {
            id: 1,
            name: "Alice",
            age: 30,
        };

        const result = omit(obj, "age");

        assertEquals(result, { id: 1, name: "Alice" });
    });

    await t.step("should handle empty keysToarray", () => {
        const obj = {
            id: 1,
            name: "Alice",
            age: 30,
        };

        const result = omit(obj, []);

        assertEquals(result, { id: 1, name: "Alice", age: 30 });
    });

    await t.step("should handle non-existent keys in keysToOmit", () => {
        const obj = {
            id: 1,
            name: "Alice",
            age: 30,
        };

        const result = omit(obj, ["email"]);

        assertEquals(result, { id: 1, name: "Alice", age: 30 });
    });
});

Deno.test("difference", async (t) => {
    await t.step("should return elements in arr1 that are not in arr2", () => {
        const arr1 = [1, 2, 3, 4, 5];
        const arr2 = [3, 4, 5, 6, 7];

        const result = difference(arr1, arr2);

        assertEquals(result, [1, 2]);
    });

    await t.step("should handle arrays with different types", () => {
        const v3 = { id: 3 };
        const arr1 = [1, "2", v3];
        const arr2 = ["2", v3, 4];

        const result = difference(arr1, arr2);

        assertEquals(result, [1]);
    });

    await t.step("should return empty array if arr1 is empty", () => {
        const arr1: number[] = [];
        const arr2 = [1, 2, 3];

        const result = difference(arr1, arr2);

        assertEquals(result, []);
    });

    await t.step("should return arr1 if arr2 is empty", () => {
        const arr1 = [1, 2, 3];
        const arr2: number[] = [];

        const result = difference(arr1, arr2);

        assertEquals(result, [1, 2, 3]);
    });

    await t.step("should handle arrays with duplicate values", () => {
        const arr1 = [1, 2, 2, 3, 4, 4, 5];
        const arr2 = [3, 4, 4, 5, 6, 7];

        const result = difference(arr1, arr2);

        assertEquals(result, [1, 2, 2]);
    });
});
