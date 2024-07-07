import { Knex } from "knex";
import { nany } from "../ninja.ts";
import { isFunction, isObject } from "./object.ts";

export interface ToKnexRaw {
  toKnexRaw(builder: nany): Knex.Raw;
}
export type Arg = number | string | boolean | ToKnexRaw | nany; // TODO: add QueryBuilderBase type

// deno-lint-ignore no-explicit-any
function isToKnexRaw(arg: any): arg is ToKnexRaw {
  return isFunction(arg.toKnexRaw);
}

export function buildArg(arg: Arg, builder: nany) {
  if (!isObject(arg)) {
    return arg;
  }

  if (isToKnexRaw(arg)) {
    return arg.toKnexRaw(builder);
  } else if (arg.isObjectionQueryBuilderBase === true) { // TODO: replace with instance check
    return arg.subqueryOf(builder).toKnexQuery();
  } else {
    return arg;
  }
}
