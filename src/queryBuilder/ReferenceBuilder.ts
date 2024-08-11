import {
  ParsedExpression,
  parseFieldExpression,
} from '../utils/parseFieldExpression.ts';
import { isObject } from '../utils/object.ts';
import { IModel } from './QueryBuilderOperationSupport.ts';
import { nany } from '../ninja.ts';
import { Knex } from 'knex';

export class ReferenceBuilder<T extends IModel> {
  #expr: string;
  #parsedExpr?: ParsedExpression;
  #column?: string;
  #table?: string;
  #cast?: string;
  #toJson: boolean;
  #alias?: string;
  #modelClass?: T;

  constructor(expr: string) {
    this.#expr = expr;
    this.#toJson = false;

    // This `if` makes it possible for `clone` to skip
    // parsing the expression again.
    if (expr !== null) {
      this.#parseExpression(expr);
    }
  }

  get parsedExpr(): ParsedExpression | undefined {
    return this.#parsedExpr;
  }

  get column(): string | undefined {
    return this.#column;
  }

  set column(column: string) {
    this.#column = column;
  }

  get alias(): string | undefined {
    return this.#alias;
  }

  set alias(alias: string) {
    this.#alias = alias;
  }

  get tableName(): string | undefined {
    return this.#table;
  }

  set tableName(table: string) {
    this.#table = table;
  }

  get modelClass(): T | undefined {
    return this.#modelClass;
  }

  set modelClass(modelClass: T) {
    this.#modelClass = modelClass;
  }

  get isPlainColumnRef() {
    return (
      (!this.#parsedExpr || this.#parsedExpr.access.length === 0) &&
      !this.#cast && !this.#toJson
    );
  }

  get expression(): string {
    return this.#expr;
  }

  get cast(): string | undefined {
    return this.#cast;
  }

  fullColumn(builder: nany): string | undefined { // TODO: type
    const table = this.tableName
      ? this.tableName
      : this.modelClass
      ? builder.tableRefFor(this.modelClass)
      : null;

    if (table) {
      return `${table}.${this.column}`;
    } else {
      return this.column;
    }
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
    this.#toJson = true;
    return this;
  }

  castTo(sqlType: string): this {
    this.#cast = sqlType;
    return this;
  }

  from(table: string): this {
    this.#table = table;
    return this;
  }

  table(table: string): this {
    this.#table = table;
    return this;
  }

  model(modelClass: T): this {
    this.#modelClass = modelClass;
    return this;
  }

  as(alias: string): this {
    this.#alias = alias;
    return this;
  }

  clone() {
    const clone = new ReferenceBuilder('');

    clone.#expr = this.#expr;
    clone.#parsedExpr = this.#parsedExpr;
    clone.#column = this.#column;
    clone.#table = this.#table;
    clone.#cast = this.#cast;
    clone.#toJson = this.#toJson;
    clone.#alias = this.#alias;
    clone.#modelClass = this.#modelClass;

    return clone;
  }

  toKnexRaw(builder: nany): Knex.RawBuilder { // TODO: type
    return builder.knex().raw(...this.#createRawArgs(builder));
  }

  #parseExpression(expr: string) {
    this.#parsedExpr = parseFieldExpression(expr);
    this.#column = this.#parsedExpr.column;
    this.#table = this.#parsedExpr.table;
  }

  #createRawArgs(builder: nany): [string, nany[]] { // TODO: type
    const bindings: nany[] = [];
    let sql = this.#createReferenceSql(builder, bindings);

    sql = this.#maybeCast(sql);
    sql = this.#maybeToJsonb(sql);
    sql = this.#maybeAlias(sql, bindings);

    return [sql, bindings];
  }

  #createReferenceSql(builder: nany, bindings: nany[]) { // TODO: type
    bindings.push(this.fullColumn(builder));

    if (this.#parsedExpr?.access.length) {
      const extractor = this.#cast ? '#>>' : '#>';
      const jsonFieldRef = this.#parsedExpr.access.map((field) => field.ref)
        .join(',');
      return `??${extractor}'{${jsonFieldRef}}'`;
    } else {
      return '??';
    }
  }

  #maybeCast(sql: string): string {
    if (this.#cast) {
      return `CAST(${sql} AS ${this.#cast})`;
    } else {
      return sql;
    }
  }

  #maybeToJsonb(sql: string): string {
    if (this.#toJson) {
      return `to_jsonb(${sql})`;
    } else {
      return sql;
    }
  }

  #maybeAlias(sql: string, bindings: nany[]): string {
    if (this.#shouldAlias()) {
      bindings.push(this.#alias);
      return `${sql} as ??`;
    } else {
      return sql;
    }
  }

  #shouldAlias() {
    if (!this.#alias) {
      return false;
    } else if (!this.isPlainColumnRef) {
      return true;
    } else {
      // No need to alias if we are dealing with a simple column reference
      // and the alias is the same as the column name.
      return this.#alias !== this.#column;
    }
  }
}

export function ref<T extends IModel>(
  reference: ReferenceBuilder<T> | string,
): ReferenceBuilder<T> {
  if (isObject(reference) && reference instanceof ReferenceBuilder) {
    return reference;
  } else {
    return new ReferenceBuilder(reference as string);
  }
}
