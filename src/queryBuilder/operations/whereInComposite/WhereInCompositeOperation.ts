import { ObjectionToKnexConvertingOperation } from '../ObjectionToKnexConvertingOperation.ts';
import { asSingle, isObject } from '../../../utils/object.ts';
import { isKnexQueryBuilder } from '../../../utils/knex.ts';
import { nany } from '../../../ninja.ts';
import {
  HasOnBuildKnex,
  QueryBuilderOperation,
} from '../QueryBuilderOperation.ts';
import knex from 'knex';

export class WhereInCompositeOperation
  extends ObjectionToKnexConvertingOperation
  implements HasOnBuildKnex {
  private prefix?: string;

  constructor(name: string, opt: nany = {}) {
    super(name, opt);
    this.prefix = this.opt.prefix;
  }

  onBuildKnex(knexBuilder: knex.Knex.QueryBuilder, builder: nany) {
    const whereInArgs = buildWhereInArgs(
      builder.knex(),
      ...(this.getKnexArgs(builder) as [nany, nany]),
    );

    if (this.prefix === 'not') {
      return knexBuilder.whereNotIn(...(whereInArgs as [nany, nany])); // TODO fix typing
    } else {
      return knexBuilder.whereIn(...(whereInArgs as [nany, nany]));
    }
  }

  override cloneInto(clone: WhereInCompositeOperation): QueryBuilderOperation {
    super.cloneInto(clone);
    clone.prefix = this.prefix;
    return clone;
  }

  override clone(): WhereInCompositeOperation {
    return this.cloneInto(
      new WhereInCompositeOperation(this.name, this.opt),
    ) as WhereInCompositeOperation;
  }
}

function buildWhereInArgs(knex: knex.Knex, columns: nany, values: nany) {
  if (isCompositeKey(columns)) {
    return buildCompositeArgs(knex, columns, values);
  } else {
    return buildNonCompositeArgs(columns, values);
  }
}

function isCompositeKey(columns: nany) {
  return Array.isArray(columns) && columns.length > 1;
}

function buildCompositeArgs(knex: knex.Knex, columns: nany, values: nany) {
  if (Array.isArray(values)) {
    return buildCompositeValueArgs(columns, values);
  } else {
    return buildCompositeSubqueryArgs(knex, columns, values);
  }
}

function buildCompositeValueArgs(columns: nany, values: nany) {
  if (!Array.isArray(values[0])) {
    return [columns, [values]];
  } else {
    return [columns, values];
  }
}

function buildCompositeSubqueryArgs(
  knex: knex.Knex,
  columns: nany,
  subquery: nany,
) {
  const sql = `(${
    columns
      .map((col: nany) => {
        // On older versions of knex, raw doesn't work
        // with `??`. We use `?` for those.
        if (isObject(col)) {
          return '?';
        } else {
          return '??';
        }
      })
      .join(',')
  })`;

  return [knex.raw(sql, columns), subquery];
}

function buildNonCompositeArgs(columns: nany, values: nany) {
  if (Array.isArray(values)) {
    values = pickNonNull(values, []);
  } else if (!isKnexQueryBuilder(values)) {
    values = [values];
  }

  return [asSingle(columns), values];
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
