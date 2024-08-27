import { normalizeRawArgs, RawBuilder } from './RawBuilder.ts';
import { asSingle, isNumber } from '../utils/object.ts';
import { nany } from '../ninja.ts';

class FunctionBuilder extends RawBuilder {}

const keywords = [
  'coalesce',
  'concat',
  'sum',
  'avg',
  'min',
  'max',
  'count',
  'upper',
  'lower',
  // deno-lint-ignore no-explicit-any
].reduce((c: any, p: string) => {
  c[p] = true;
  return c;
}, {});

export function fn(...argsIn: [string, ...nany[]]) {
  const { sql, args } = normalizeRawArgs(argsIn);
  return new FunctionBuilder(`${sql}(${args.map(() => '?').join(', ')})`, args);
}

export function createFunctionBuilder(
  name: string,
): (...args: nany[]) => FunctionBuilder {
  if (name === 'now') {
    return (precision: string | string[]) => {
      let p = parseInt(asSingle(precision), 10);

      if (isNaN(p) || !isNumber(p)) {
        p = 6;
      }

      // We need to use a literal precision instead of a binding here
      // for the CURRENT_TIMESTAMP to work. This is okay here since we
      // make sure `precision` is a number. There's no chance of SQL
      // injection here.
      return new FunctionBuilder(`CURRENT_TIMESTAMP(${p})`, []);
    };
  } else if (keywords[name]) {
    return (...args: nany[]) => fn(name, args);
  }
  throw new Error(`Function ${name} not supported.`);
}
