import { asArray, isObject } from '../utils/object.ts';
import { buildArg } from '../utils/build.ts';
import { Knex } from 'knex';
import { nany } from '../ninja.ts';

type PrimitiveValue =
  | string
  | number
  | boolean
  | Date
  | Deno.Buffer
  | string[]
  | number[]
  | boolean[]
  | Date[]
  | Deno.Buffer[]
  | null;

interface PrimitiveValueObject {
  [key: string]: PrimitiveValue;
}

export type AnyValue =
  | PrimitiveValue
  | PrimitiveValue[]
  | PrimitiveValueObject
  | PrimitiveValueObject[];

export class ValueBuilder {
  #value: AnyValue;
  #cast?: string;
  #toJson: boolean;
  #toArray: boolean;
  #alias?: string;

  constructor(
    value: AnyValue,
  ) {
    this.#value = value;
    // Cast objects and arrays to json by default.
    this.#toJson = isObject(value);
    this.#toArray = false;
  }

  get cast() {
    return this.#cast;
  }

  castText(): this {
    return this.castTo('text');
  }

  castInt(): this {
    return this.castTo('integer');
  }

  castBigInt(): this {
    return this.castTo('bigint');
  }

  castFloat(): this {
    return this.castTo('float');
  }

  castDecimal(): this {
    return this.castTo('decimal');
  }

  castReal(): this {
    return this.castTo('real');
  }

  castBool(): this {
    return this.castTo('boolean');
  }

  castJson(): this {
    this.#toArray = false;
    this.#toJson = true;
    this.#cast = 'jsonb';
    return this;
  }

  castTo(sqlType: string): this {
    this.#cast = sqlType;
    return this;
  }

  asArray(): this {
    this.#toJson = false;
    this.#toArray = true;
    return this;
  }

  as(alias: string): this {
    this.#alias = alias;
    return this;
  }

  toKnexRaw(builder: nany): Knex.RawBuilder { // TODO: Use QueryBuilder type
    return builder.knex().raw(...this.#createRawArgs(builder));
  }

  // deno-lint-ignore no-explicit-any
  #createRawArgs(builder: nany): [string, any[]] {
    // deno-lint-ignore no-explicit-any
    const bindings: any[] = [];
    let sql: string | null = null;

    if (this.#toJson) {
      bindings.push(JSON.stringify(this.#value));
      sql = '?';
    } else if (this.#toArray) {
      const values = asArray(this.#value as PrimitiveValue[]);
      bindings.push(...values.map((it) => buildArg(it, builder)));
      sql = `ARRAY[${values.map(() => '?').join(', ')}]`;
    } else {
      bindings.push(this.#value);
      sql = '?';
    }

    if (this.#cast) {
      sql = `CAST(${sql} AS ${this.#cast})`;
    }

    if (this.#alias) {
      bindings.push(this.#alias);
      sql = `${sql} as ??`;
    }

    return [sql, bindings];
  }
}

/**
 * Creates a new `ValueBuilder` instance with the specified value.
 *
 * @param val - The value to be used in the `ValueBuilder`.
 * @returns A new `ValueBuilder` instance.
 */
export function val(val: AnyValue) {
  return new ValueBuilder(val);
}
