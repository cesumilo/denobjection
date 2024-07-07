// deno-lint-ignore-file no-explicit-any
import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  asArray,
  asSingle,
  chunk,
  clone,
  cloneDeep,
  difference,
  flatten,
  GenericRecord,
  get,
  groupBy,
  isBuffer,
  isEmpty,
  isFunction,
  isNumber,
  isObject,
  isPlainObject,
  isRegExp,
  isString,
  jsonEquals,
  last,
  mergeMaps,
  omit,
  once,
  set,
  union,
  uniqBy,
  upperFirst,
  values,
  zipObject,
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

Deno.test("union", async (t) => {
  await t.step("of two small arrays", () => {
    const arr1 = [1, 2, 3];
    const arr2 = [3, 4, 5];
    const expected = [1, 2, 3, 4, 5];
    assertEquals(union(arr1, arr2), expected);
  });

  await t.step("of one small and one large array", () => {
    const arr1 = [1, 2, 3];
    const arr2 = Array.from({ length: 20 }, (_, i) => i + 1); // Large array
    const expected = Array.from(new Set([...arr1, ...arr2]));
    assertEquals(union(arr1, arr2), expected);
  });

  await t.step("of two large arrays", () => {
    const arr1 = Array.from({ length: 20 }, (_, i) => i + 1); // Large array
    const arr2 = Array.from({ length: 20 }, (_, i) => i + 10); // Large array with overlap
    const expected = Array.from(new Set([...arr1, ...arr2]));
    assertEquals(union(arr1, arr2), expected);
  });

  await t.step("with empty arrays", () => {
    const arr1: number[] = [];
    const arr2: number[] = [];
    const expected: number[] = [];
    assertEquals(union(arr1, arr2), expected);
  });

  await t.step("with one empty array", () => {
    const arr1 = [1, 2, 3];
    const arr2: number[] = [];
    const expected = [1, 2, 3];
    assertEquals(union(arr1, arr2), expected);
  });

  await t.step("with identical small arrays", () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    const expected = [1, 2, 3];
    assertEquals(union(arr1, arr2), expected);
  });

  await t.step("with identical large arrays", () => {
    const arr1 = Array.from({ length: 20 }, (_, i) => i + 1);
    const arr2 = Array.from({ length: 20 }, (_, i) => i + 1);
    const expected = Array.from(new Set([...arr1, ...arr2]));
    assertEquals(union(arr1, arr2), expected);
  });
});

Deno.test("last", async (t) => {
  await t.step("should return last value from array", () => {
    assertEquals(last<string>(["foo", "bar"]), "bar");
  });
});

Deno.test("upperFirst", async (t) => {
  await t.step(
    "should return the string with an first letter upper case",
    () => {
      assertEquals(upperFirst("foo"), "Foo");
    },
  );
});

Deno.test("values", async (t) => {
  await t.step("of a simple object", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const expected = [1, 2, 3];
    assertEquals(values(obj), expected);
  });

  await t.step("of an object with different types", () => {
    const obj = { a: 1, b: "two", c: true };
    const expected = [1, "two", true];
    assertEquals(values(obj), expected);
  });

  await t.step("of an object with nested objects", () => {
    const obj = { a: { nested: "object" }, b: 2 };
    const expected = [{ nested: "object" }, 2];
    assertEquals(values(obj), expected);
  });

  await t.step("of an object with array values", () => {
    const obj = { a: [1, 2, 3], b: "hello" };
    const expected = [[1, 2, 3], "hello"];
    assertEquals(values(obj), expected);
  });

  await t.step("of an empty object", () => {
    const obj = {};
    const expected: unknown[] = [];
    assertEquals(values(obj), expected);
  });

  await t.step("of a non-object (string)", () => {
    const obj = "not an object";
    const expected: unknown[] = [];
    assertEquals(values(obj), expected);
  });

  await t.step("of a non-object (number)", () => {
    const obj = 123;
    const expected: unknown[] = [];
    assertEquals(values(obj), expected);
  });

  await t.step("of a non-object (null)", () => {
    const obj = null;
    const expected: unknown[] = [];
    assertEquals(values(obj), expected);
  });

  await t.step("of a non-object (undefined)", () => {
    const obj = undefined;
    const expected: unknown[] = [];
    assertEquals(values(obj), expected);
  });

  await t.step("of a non-object (array)", () => {
    const obj = [1, 2, 3];
    const expected: unknown[] = [1, 2, 3];
    assertEquals(values(obj), expected);
  });
});

Deno.test("once", async (t) => {
  await t.step("function calls the original function once", () => {
    let callCount = 0;
    const originalFunc = () => {
      callCount++;
      return callCount;
    };

    const onceFunc = once(originalFunc);

    assertEquals(onceFunc(), 1);
    assertEquals(onceFunc(), 1);
    assertEquals(callCount, 1);
  });

  await t.step("function passes arguments correctly", () => {
    const originalFunc = (a: number, b: number) => a + b;
    const onceFunc = once(originalFunc);

    assertEquals(onceFunc(2, 3), 5);
    assertEquals(onceFunc(5, 7), 5); // Should still return the first result
  });

  await t.step("function preserves this context", () => {
    // const obj = {
    //     value: 42,
    //     getValue: once(function () {
    //         return this.value;
    //     }.bind(this)),
    // };

    class TestObj {
      public value: number;

      constructor(value: number) {
        this.value = value;
      }

      getValue(): number {
        return this.value;
      }
    }
    const obj = new TestObj(42);
    const onceFunc = once(obj.getValue.bind(obj));

    assertEquals(onceFunc(), 42);
    obj.value = 100;
    assertEquals(onceFunc(), 42); // Should still return the first result
  });

  await t.step("function handles no arguments", () => {
    const originalFunc = () => "no args";
    const onceFunc = once(originalFunc);

    assertEquals(onceFunc(), "no args");
    assertEquals(onceFunc(), "no args");
  });

  await t.step(
    "function handles multiple calls with different arguments",
    () => {
      const originalFunc = (x: number) => x * 2;
      const onceFunc = once(originalFunc);

      assertEquals(onceFunc(10), 20);
      assertEquals(onceFunc(20), 20); // Should still return the first result
    },
  );

  await t.step(
    "function returns undefined if original function returns undefined",
    () => {
      const originalFunc = () => undefined;
      const onceFunc = once(originalFunc);

      assertEquals(onceFunc(), undefined);
      assertEquals(onceFunc(), undefined);
    },
  );

  await t.step("function handles asynchronous functions", async () => {
    const originalFunc = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("async result");
        }, 100);
      });
    };

    const onceFunc = once(originalFunc);

    const result1 = await onceFunc();
    const result2 = await onceFunc();
    assertEquals(result1, "async result");
    assertEquals(result2, "async result");
  });
});

Deno.test("flatten", async (t) => {
  await t.step("flattens an array with no nested arrays", () => {
    const input = [1, 2, 3, 4];
    const expected = [1, 2, 3, 4];
    assertEquals(flatten(input), expected);
  });

  await t.step("flattens a single nested array", () => {
    const input = [1, [2, 3], 4];
    const expected = [1, 2, 3, 4];
    assertEquals(flatten(input), expected);
  });

  await t.step("flattens multiple nested arrays", () => {
    const input = [1, [2, 3], [4, 5]];
    const expected = [1, 2, 3, 4, 5];
    assertEquals(flatten(input), expected);
  });

  await t.step("handles deeply nested arrays", () => {
    const input = [1, [2, [3, 4]], 5];
    const expected = [1, 2, [3, 4], 5];
    assertEquals(flatten(input), expected);
  });

  await t.step("handles mixed types", () => {
    const input = [1, "two", [3, "four"], true];
    const expected = [1, "two", 3, "four", true];
    assertEquals(flatten(input), expected);
  });

  await t.step("handles empty arrays", () => {
    const input: any[] = [];
    const expected: any[] = [];
    assertEquals(flatten(input), expected);
  });

  await t.step("handles arrays with empty nested arrays", () => {
    const input = [1, [], [2, 3], []];
    const expected = [1, 2, 3];
    assertEquals(flatten(input), expected);
  });
});

Deno.test("get", async (t) => {
  await t.step("retrieves a top-level property", () => {
    const obj = { a: 1, b: 2 };
    const path = ["a"];
    assertEquals(get(obj, path), 1);
  });

  await t.step("retrieves a nested property", () => {
    const obj = { a: { b: { c: 3 } } };
    const path = ["a", "b", "c"];
    assertEquals(get(obj, path), 3);
  });

  await t.step("returns undefined for non-existent property", () => {
    const obj = { a: 1 };
    const path = ["b"];
    assertStrictEquals(get(obj, path), undefined);
  });

  await t.step("returns undefined for non-object in path", () => {
    const obj = { a: 1 };
    const path = ["a", "b"];
    assertStrictEquals(get(obj, path), undefined);
  });

  await t.step("retrieves property with array in path", () => {
    const obj = { a: [{ b: 2 }] };
    const path = ["a", "0", "b"];
    assertEquals(get(obj, path), 2);
  });

  await t.step(
    "returns undefined for non-existent nested property",
    () => {
      const obj = { a: { b: 2 } };
      const path = ["a", "c"];
      assertStrictEquals(get(obj, path), undefined);
    },
  );

  await t.step("retrieves value from complex object", () => {
    const obj = { a: { b: { c: { d: 4 } } } };
    const path = ["a", "b", "c", "d"];
    assertEquals(get(obj, path), 4);
  });
});

Deno.test("set", async (t) => {
  await t.step("sets a top-level property", () => {
    const obj = { a: 1, b: 2 };
    const path = ["c"];
    const value = 3;
    const expected = { a: 1, b: 2, c: 3 };
    assertEquals(set(obj, path, value), expected);
  });

  await t.step("sets a nested property", () => {
    const obj = { a: { b: { c: 3 } } };
    const path = ["a", "b", "d"];
    const value = 4;
    const expected = { a: { b: { c: 3, d: 4 } } };
    assertEquals(set(obj, path, value), expected);
  });

  await t.step("creates nested objects for non-existent paths", () => {
    const obj = { a: 1 };
    const path = ["b", "c", "d"];
    const value = 2;
    const expected = { a: 1, b: { c: { d: 2 } } };
    assertEquals(set(obj, path, value), expected);
  });

  await t.step("overwrites existing properties", () => {
    const obj = { a: { b: 2 } };
    const path = ["a", "b"];
    const value = 3;
    const expected = { a: { b: 3 } };
    assertEquals(set(obj, path, value), expected);
  });

  await t.step("works with array indices in the path", () => {
    const obj: GenericRecord = { a: [{ b: 2 }] };
    const path = ["a", 0, "b"];
    const value = 3;
    const expected = { a: [{ b: 3 }] };
    assertEquals(set(obj, path, value), expected);
  });

  await t.step("creates arrays for numeric keys", () => {
    const obj: GenericRecord = {};
    const path = ["a", 0, "b"];
    const value = 3;
    const expected = { a: [{ b: 3 }] };
    assertEquals(set(obj, path, value), expected);
  });

  await t.step(
    "returns the original object when an unsafe key is encountered",
    () => {
      const obj = { a: 1 };
      const path = ["__proto__", "b"];
      const value = 2;
      const expected = { a: 1 };
      assertStrictEquals(set(obj, path, value), obj);
      assertEquals(obj, expected);
    },
  );
});

Deno.test("zipObject", async (t) => {
  await t.step("creates an object from keys and values", () => {
    const keys = ["a", "b", "c"];
    const values = [1, 2, 3];
    const expected = { a: 1, b: 2, c: 3 };
    assertEquals(zipObject(keys, values), expected);
  });

  await t.step("handles keys with numeric values", () => {
    const keys = [1, 2, 3];
    const values = ["one", "two", "three"];
    const expected = { 1: "one", 2: "two", 3: "three" };
    assertEquals(zipObject(keys, values), expected);
  });

  await t.step("handles extra values", () => {
    const keys = ["a", "b"];
    const values = [1, 2, 3];
    const expected = { a: 1, b: 2 };
    assertEquals(zipObject(keys, values), expected);
  });

  await t.step("handles extra keys", () => {
    const keys = ["a", "b", "c"];
    const values = [1, 2];
    const expected = { a: 1, b: 2, c: undefined };
    assertEquals(zipObject<unknown>(keys, values), expected);
  });

  await t.step("handles empty arrays", () => {
    const keys: string[] = [];
    const values: number[] = [];
    const expected = {};
    assertEquals(zipObject(keys, values), expected);
  });

  await t.step("ignores unsafe keys", () => {
    const keys = ["a", "__proto__", "b"];
    const values = [1, 2, 3];
    const expected = { a: 1, b: 3 };
    assertEquals(zipObject(keys, values), expected);
  });
});

Deno.test("chunk", async (t) => {
  await t.step("divides an array into chunks of specified size", () => {
    const arr = [1, 2, 3, 4, 5];
    const chunkSize = 2;
    const expected = [[1, 2], [3, 4], [5]];
    assertEquals(chunk(arr, chunkSize), expected);
  });

  await t.step("works with size larger than array length", () => {
    const arr = [1, 2, 3];
    const chunkSize = 5;
    const expected = [[1, 2, 3]];
    assertEquals(chunk(arr, chunkSize), expected);
  });

  await t.step("works with size equal to array length", () => {
    const arr = [1, 2, 3];
    const chunkSize = 3;
    const expected = [[1, 2, 3]];
    assertEquals(chunk(arr, chunkSize), expected);
  });

  await t.step("works with size of 1", () => {
    const arr = [1, 2, 3];
    const chunkSize = 1;
    const expected = [[1], [2], [3]];
    assertEquals(chunk(arr, chunkSize), expected);
  });

  await t.step("handles empty array", () => {
    const arr: number[] = [];
    const chunkSize = 2;
    const expected: number[][] = [];
    assertEquals(chunk(arr, chunkSize), expected);
  });

  await t.step("handles size of 0", () => {
    const arr = [1, 2, 3];
    const chunkSize = 0;
    const expected: number[][] = [];
    assertEquals(chunk(arr, chunkSize), expected);
  });

  await t.step("handles negative size", () => {
    const arr = [1, 2, 3];
    const chunkSize = -1;
    const expected: number[][] = [];
    assertEquals(chunk(arr, chunkSize), expected);
  });

  await t.step("handles array with various types", () => {
    const arr = [1, "two", 3, { four: 4 }, [5]];
    const chunkSize = 2;
    const expected = [[1, "two"], [3, { four: 4 }], [[5]]];
    assertEquals(chunk(arr, chunkSize), expected);
  });
});

Deno.test("jsonEquals", async (t) => {
  await t.step("compares primitives correctly", () => {
    assertEquals(jsonEquals(1, 1), true);
    assertEquals(jsonEquals(1, 2), false);
    assertEquals(jsonEquals("a", "a"), true);
    assertEquals(jsonEquals("a", "b"), false);
    assertEquals(jsonEquals(true, true), true);
    assertEquals(jsonEquals(true, false), false);
  });

  await t.step("compares arrays correctly", () => {
    assertEquals(jsonEquals([1, 2, 3], [1, 2, 3]), true);
    assertEquals(jsonEquals([1, 2, 3], [3, 2, 1]), false);
    assertEquals(jsonEquals([1, 2, 3], [1, 2]), false);
  });

  await t.step("compares objects correctly", () => {
    assertEquals(jsonEquals({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
    assertEquals(jsonEquals({ a: 1, b: 2 }, { a: 1, b: 3 }), false);
    assertEquals(jsonEquals({ a: 1, b: 2 }, { a: 1 }), false);
    assertEquals(jsonEquals({ a: 1 }, { b: 1 }), false);
  });

  await t.step("compares nested objects correctly", () => {
    assertEquals(jsonEquals({ a: { b: 2 } }, { a: { b: 2 } }), true);
    assertEquals(jsonEquals({ a: { b: 2 } }, { a: { b: 3 } }), false);
    assertEquals(jsonEquals({ a: { b: 2 } }, { a: {} }), false);
  });

  await t.step("compares dates correctly", () => {
    const date1 = new Date("2021-01-01");
    const date2 = new Date("2021-01-01");
    const date3 = new Date("2022-01-01");

    assertEquals(jsonEquals(date1, date2), true);
    assertEquals(jsonEquals(date1, date3), false);
  });

  await t.step("compares null and undefined correctly", () => {
    assertEquals(jsonEquals(null, null), true);
    assertEquals(jsonEquals(undefined, undefined), true);
    assertEquals(jsonEquals(null, undefined), false);
    assertEquals(jsonEquals(undefined, null), false);
  });

  await t.step("compares mixed types correctly", () => {
    assertEquals(jsonEquals({ a: [1, 2, 3] }, { a: [1, 2, 3] }), true);
    assertEquals(jsonEquals({ a: [1, 2, 3] }, { a: [3, 2, 1] }), false);
    assertEquals(jsonEquals([{ a: 1 }], [{ a: 1 }]), true);
    assertEquals(jsonEquals([{ a: 1 }], [{ a: 2 }]), false);
    assertEquals(jsonEquals([{ a: 1 }], [{ b: 1 }]), false);
  });
});

Deno.test("mergeMaps", async (t) => {
  await t.step("merges two maps correctly", () => {
    const map1 = new Map([["a", 1], ["b", 2]]);
    const map2 = new Map([["b", 3], ["c", 4]]);
    const expected = new Map([["a", 1], ["b", 3], ["c", 4]]);
    assertEquals(mergeMaps(map1, map2), expected);
  });

  await t.step("returns the first map if the second map is empty", () => {
    const map1 = new Map([["a", 1], ["b", 2]]);
    const map2 = new Map();
    const expected = new Map([["a", 1], ["b", 2]]);
    assertEquals(mergeMaps(map1, map2), expected);
  });

  await t.step("returns the second map if the first map is empty", () => {
    const map1 = new Map();
    const map2 = new Map([["a", 1], ["b", 2]]);
    const expected = new Map([["a", 1], ["b", 2]]);
    assertEquals(mergeMaps(map1, map2), expected);
  });

  await t.step("returns an empty map if both maps are empty", () => {
    const map1 = new Map();
    const map2 = new Map();
    const expected = new Map();
    assertEquals(mergeMaps(map1, map2), expected);
  });

  await t.step("handles maps with different types of keys", () => {
    const map1 = new Map<number, string>([[1, "one"], [2, "two"]]);
    const map2 = new Map<number, string>([[2, "deux"], [3, "trois"]]);
    const expected = new Map<number, string | undefined>([[1, "one"], [
      2,
      "deux",
    ], [3, "trois"]]);
    assertEquals(mergeMaps(map1, map2), expected);
  });

  await t.step(
    "overwrites values from the first map with values from the second map",
    () => {
      const map1 = new Map([["a", 1], ["b", 2]]);
      const map2 = new Map([["a", 3], ["b", 4]]);
      const expected = new Map([["a", 3], ["b", 4]]);
      assertEquals(mergeMaps(map1, map2), expected);
    },
  );

  await t.step("does not alter the original maps", () => {
    const map1 = new Map([["a", 1], ["b", 2]]);
    const map2 = new Map([["b", 3], ["c", 4]]);
    mergeMaps(map1, map2);
    assertEquals(map1, new Map([["a", 1], ["b", 2]]));
    assertEquals(map2, new Map([["b", 3], ["c", 4]]));
  });
});

Deno.test("clone", async (t) => {
  await t.step("clones primitive values correctly", () => {
    assertEquals(clone(1), 1);
    assertEquals(clone("a"), "a");
    assertEquals(clone(true), true);
    assertEquals(clone(null), null);
    assertEquals(clone(undefined), undefined);
  });

  await t.step("clones arrays correctly", () => {
    const array = [1, 2, 3];
    const clonedArray = clone(array);
    assertEquals(clonedArray, array);
    assertEquals(clonedArray !== array, true); // Check if it's a different reference
  });

  await t.step("clones objects correctly", () => {
    const obj = { a: 1, b: 2 };
    const clonedObj = clone(obj);
    assertEquals(clonedObj, obj);
    assertEquals(clonedObj !== obj, true); // Check if it's a different reference
  });

  await t.step("clones dates correctly", () => {
    const date = new Date("2021-01-01");
    const clonedDate = clone(date);
    assertEquals(clonedDate.getTime(), date.getTime());
    assertEquals(clonedDate !== date, true); // Check if it's a different reference
  });

  await t.step("clones maps correctly", () => {
    const map = new Map([["a", 1], ["b", 2]]);
    const clonedMap = clone(map);
    assertEquals(clonedMap, map);
    assertEquals(clonedMap !== map, true); // Check if it's a different reference
  });

  await t.step("clones sets correctly", () => {
    const set = new Set([1, 2, 3]);
    const clonedSet = clone(set);
    assertEquals(clonedSet, set);
    assertEquals(clonedSet !== set, true); // Check if it's a different reference
  });

  await t.step("clones buffers correctly", () => {
    const buffer = new Deno.Buffer(new Uint8Array([1, 2, 3]));
    const clonedBuffer = clone(buffer);
    assertEquals(clonedBuffer.bytes(), buffer.bytes());
    assertEquals(clonedBuffer !== buffer, true); // Check if it's a different reference
  });

  await t.step("throws error for unsupported data types", () => {
    class CustomClass {}
    const customObj = new CustomClass();
    try {
      clone(customObj);
    } catch (e) {
      assertEquals(e.message, "Unsupported data type");
    }
  });
});

Deno.test("cloneDeep", async (t) => {
  await t.step("clones primitive values correctly", () => {
    assertEquals(cloneDeep(1), 1);
    assertEquals(cloneDeep("a"), "a");
    assertEquals(cloneDeep(true), true);
    assertEquals(cloneDeep(null), null);
    assertEquals(cloneDeep(undefined), undefined);
  });

  await t.step("clones arrays deeply", () => {
    const array = [1, [2, 3], { a: 4 }];
    const clonedArray = cloneDeep(array);
    assertEquals(clonedArray, array);
    assertEquals(clonedArray !== array, true); // Check if it's a different reference
    assertEquals(clonedArray[1] !== array[1], true); // Check if nested array is a different reference
    assertEquals(clonedArray[2] !== array[2], true); // Check if nested object is a different reference
  });

  await t.step("clones objects deeply", () => {
    const obj = { a: 1, b: { c: 2, d: [3, 4] } };
    const clonedObj = cloneDeep(obj);
    assertEquals(clonedObj, obj);
    assertEquals(clonedObj !== obj, true); // Check if it's a different reference
    assertEquals(clonedObj.b !== obj.b, true); // Check if nested object is a different reference
    assertEquals(clonedObj.b.d !== obj.b.d, true); // Check if nested array is a different reference
  });

  await t.step("clones dates correctly", () => {
    const date = new Date("2021-01-01");
    const clonedDate = cloneDeep(date);
    assertEquals(clonedDate.getTime(), date.getTime());
    assertEquals(clonedDate !== date, true); // Check if it's a different reference
  });

  await t.step("clones maps deeply", () => {
    const map = new Map([["a", { b: 1 }], ["c", [2, 3]]]);
    const clonedMap = cloneDeep(map);
    assertEquals(clonedMap, map);
    assertEquals(clonedMap !== map, true); // Check if it's a different reference
    assertEquals(clonedMap.get("a") !== map.get("a"), true); // Check if nested object is a different reference
    assertEquals(clonedMap.get("c") !== map.get("c"), true); // Check if nested array is a different reference
  });

  await t.step("clones sets deeply", () => {
    const set = new Set([1, { a: 2 }, [3, 4]]);
    const clonedSet = cloneDeep(set);
    assertEquals(clonedSet, set);
    assertEquals(clonedSet !== set, true); // Check if it's a different reference
    assertEquals([...clonedSet][1] !== [...set][1], true); // Check if nested object is a different reference
    assertEquals([...clonedSet][2] !== [...set][2], true); // Check if nested array is a different reference
  });

  await t.step("clones buffers correctly", () => {
    const buffer = new Deno.Buffer(new Uint8Array([1, 2, 3]));
    const clonedBuffer = cloneDeep(buffer);
    assertEquals(clonedBuffer.bytes(), buffer.bytes());
    assertEquals(clonedBuffer !== buffer, true); // Check if it's a different reference
  });

  await t.step("handles unsupported data types", () => {
    class CustomClass {}
    const customObj = new CustomClass();
    try {
      cloneDeep(customObj);
    } catch (e) {
      assertEquals(e.message, "Unsupported data type");
    }
  });
});
