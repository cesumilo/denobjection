// deno-lint-ignore-file no-explicit-any
import { flatten } from "./object.ts";

export type MixinFunc<
  T extends new (...args: any[]) => any,
> = (Class: T) => T;

// TODO: rework typing to avoid casting output
export function mixin<T extends new (...args: any[]) => any>(
  ...params: [T, ...MixinFunc<T>[]]
) {
  const args = flatten(params);
  const mixins = args.slice(1) as MixinFunc<T>[];

  return mixins.reduce((Class: T, mixinFunc: MixinFunc<T>) => {
    return mixinFunc(Class);
  }, args[0] as T);
}

// TODO: rework typing to avoid casting output
export function compose<T extends new (...args: any[]) => any>(
  ...args: MixinFunc<T>[]
): (arg0: T) => T {
  const mixins = flatten(args);

  return function (Class: T) {
    return mixin<T>(Class, ...mixins);
  };
}
