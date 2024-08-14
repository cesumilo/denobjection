import { ObjectionToKnexConvertingOperation } from '../ObjectionToKnexConvertingOperation.ts';
import { isKnexQueryBuilder } from '../../../utils/knex.ts';
import { asSingle } from '../../../utils/object.ts';
import {
  HasOnBuildKnex,
  QueryBuilderOperation,
} from '../QueryBuilderOperation.ts';
import { nany } from '../../../ninja.ts';
import knex from 'knex';

export class WhereInCompositeSqliteOperation
  extends ObjectionToKnexConvertingOperation
  implements HasOnBuildKnex {
  private prefix?: string;

  constructor(name: string, opt: nany = {}) {
    super(name, opt);
    this.prefix = this.opt.prefix;
  }

  onBuildKnex(knexBuilder: knex.Knex.QueryBuilder, builder: nany) {
    const { method, args } = buildWhereArgs(
      ...(this.getKnexArgs(builder) as [nany, nany]),
    );

    if (method === 'where') {
      if (this.prefix === 'not') {
        return knexBuilder.whereNot(...(args as [nany])); // TODO fix typing
      } else {
        return knexBuilder.where(...(args as [nany, nany])); // TODO fix typing
      }
    } else {
      if (this.prefix === 'not') {
        return knexBuilder.whereNotIn(...(args as [nany, nany])); // TODO fix typing
      } else {
        return knexBuilder.whereIn(...(args as [nany, nany])); // TODO fix typing
      }
    }
  }

  override cloneInto(
    clone: WhereInCompositeSqliteOperation,
  ): QueryBuilderOperation {
    super.cloneInto(clone);
    clone.prefix = this.prefix;
    return clone;
  }

  override clone(): WhereInCompositeSqliteOperation {
    return this.cloneInto(
      new WhereInCompositeSqliteOperation(this.name, this.opt),
    ) as WhereInCompositeSqliteOperation;
  }
}

function buildWhereArgs(columns: nany, values: nany) {
  if (isCompositeKey(columns)) {
    return buildCompositeArgs(columns, values);
  } else {
    return buildNonCompositeArgs(columns, values);
  }
}

function isCompositeKey(columns: nany) {
  return Array.isArray(columns) && columns.length > 1;
}

function buildCompositeArgs(columns: nany, values: nany) {
  if (!Array.isArray(values)) {
    // If the `values` is not an array of values but a function or a subquery
    // we have no way to implement this method.
    throw new Error(`sqlite doesn't support multi-column where in clauses`);
  }

  // Sqlite doesn't support the `where in` syntax for multiple columns but
  // we can emulate it using grouped `or` clauses.
  return {
    method: 'where',
    args: [
      (builder: nany) => {
        values.forEach((val) => {
          builder.orWhere((builder: nany) => {
            columns.forEach((col: nany, idx: number) => {
              builder.andWhere(col, val[idx]);
            });
          });
        });
      },
    ],
  };
}

function buildNonCompositeArgs(columns: nany, values: nany) {
  if (Array.isArray(values)) {
    values = pickNonNull(values, []);
  } else if (!isKnexQueryBuilder(values)) {
    values = [values];
  }

  return {
    method: 'whereIn',
    args: [asSingle(columns), values],
  };
}

function pickNonNull(values: nany[], output: nany[]) {
  for (let i = 0, l = values.length; i < l; ++i) {
    const val = values[i];

    if (Array.isArray(val)) {
      pickNonNull(val, output);
    } else if (val !== null && val !== undefined) {
      output.push(val);
    }
  }

  return output;
}
