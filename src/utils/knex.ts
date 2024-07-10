import { Knex } from 'knex';
import { isFunction, isObject } from '../utils/object.ts';

export function getDialect(knex: Knex | null): string | null {
  const type = typeof knex;
  return (
    (knex !== null &&
      (type === 'object' || type === 'function') &&
      knex.client &&
      knex.client.dialect) ||
    null
  );
}

export function isPostgres(knex: Knex | null): boolean {
  return getDialect(knex) === 'postgresql';
}

export function isOracle(knex: Knex | null): boolean {
  const dialect = getDialect(knex);
  return dialect === 'oracle' || dialect === 'oracledb';
}

export function isMySql(knex: Knex | null): boolean {
  const dialect = getDialect(knex);
  return dialect === 'mysql' || dialect === 'mysql2';
}

export function isSqlite(knex: Knex | null): boolean {
  return getDialect(knex) === 'sqlite3';
}

export function isMsSql(knex: Knex | null): boolean {
  return getDialect(knex) === 'mssql';
}

// deno-lint-ignore no-explicit-any
export function isKnexQueryBuilder(value: any): boolean {
  return (
    hasConstructor(value) &&
    isFunction(value.select) &&
    isFunction(value.column) &&
    value.select === value.column &&
    'client' in value
  );
}

// deno-lint-ignore no-explicit-any
export function isKnexJoinBuilder(value: any): boolean {
  return hasConstructor(value) && value.grouping === 'join' &&
    'joinType' in value;
}

// deno-lint-ignore no-explicit-any
export function isKnexRaw(value: any): boolean {
  return hasConstructor(value) && value.isRawInstance && 'client' in value;
}

export function isKnexTransaction(knex: Knex.Transaction | null): boolean {
  return !!getDialect(knex) && isFunction(knex?.commit) &&
    isFunction(knex.rollback);
}

// deno-lint-ignore no-explicit-any
function hasConstructor(value: any): boolean {
  return isObject(value) && isFunction(value.constructor);
}
