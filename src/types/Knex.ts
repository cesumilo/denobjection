import { Knex } from 'knex';

// deno-lint-ignore no-explicit-any
export type Value<T = any> = Knex.DbColumn<T> | null;
export type Column = string | number | symbol;
