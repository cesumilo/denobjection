import { ObjectionToKnexConvertingOperation } from '../ObjectionToKnexConvertingOperation.ts';
import { flatten, isString, zipObject } from '../../../utils/object.ts';
import { getTempColumn } from '../../../utils/tmpColumnUtils.ts';
import { nany } from '../../../ninja.ts';
import knex from 'knex';
import {
  HasOnBuildKnex,
  QueryBuilderOperation,
} from '../QueryBuilderOperation.ts';
import { Column, Value } from '../../../types/Knex.ts';

export class WhereInCompositeMsSqlOperation
  extends ObjectionToKnexConvertingOperation
  implements HasOnBuildKnex {
  private prefix?: string;

  constructor(name: string, opt: nany = {}) {
    super(name, opt);
    this.prefix = this.opt.prefix;
  }

  onBuildKnex(knexBuilder: knex.Knex.QueryBuilder, builder: nany) {
    const args = this.getKnexArgs(builder);
    return this.build(builder.knex(), knexBuilder, args[0], args[1]);
  }

  build(
    knex: knex.Knex,
    knexBuilder: knex.Knex.QueryBuilder,
    columns: nany, // TODO figure out the type
    values: nany, // TODO figure out the type
  ) {
    const isCompositeKey = Array.isArray(columns) && columns.length > 1;

    if (isCompositeKey) {
      return this.buildComposite(knex, knexBuilder, columns, values);
    } else {
      return this.buildNonComposite(knexBuilder, columns, values);
    }
  }

  buildComposite(
    knex: knex.Knex,
    knexBuilder: knex.Knex.QueryBuilder,
    columns: Column[],
    values: nany[] | nany,
  ) {
    const helperColumns = columns.map((_, index) => getTempColumn(index));

    if (Array.isArray(values)) {
      return this.buildCompositeValue(
        knex,
        knexBuilder,
        columns,
        helperColumns,
        values,
      );
    } else {
      return this.buildCompositeSubquery(
        knex,
        knexBuilder,
        columns,
        helperColumns,
        values.as(
          knex.raw(`V(${helperColumns.map((_) => '??')})`, helperColumns),
        ),
      );
    }
  }

  buildCompositeValue(
    knex: knex.Knex,
    knexBuilder: knex.Knex.QueryBuilder,
    columns: Column[],
    helperColumns: Column[],
    values: nany[],
  ) {
    return this.buildCompositeSubquery(
      knex,
      knexBuilder,
      columns,
      helperColumns,
      knex.raw(
        `(VALUES ${
          values
            .map((value) => `(${value.map((_: unknown) => '?').join(',')})`)
            .join(',')
        }) AS V(${helperColumns.map((_) => '??').join(',')})`,
        flatten(values).concat(helperColumns),
      ),
    );
  }

  buildCompositeSubquery(
    knex: knex.Knex,
    knexBuilder: knex.Knex.QueryBuilder,
    columns: nany[], // TODO figure out the type
    helperColumns: Column[],
    subQuery: knex.Knex.Raw<any>,
  ) {
    const wrapperQuery = knex.from(subQuery).where(
      zipObject(
        helperColumns,
        columns.map((column) => knex.raw('??', column)),
      ),
    );

    if (this.prefix === 'not') {
      return knexBuilder.whereNotExists(wrapperQuery);
    } else {
      return knexBuilder.whereExists(wrapperQuery);
    }
  }

  buildNonComposite(
    knexBuilder: knex.Knex.QueryBuilder,
    columns: string | string[],
    values: Value | Value[],
  ) {
    const col = isString(columns) ? columns : (columns as string[])[0];

    if (Array.isArray(values)) {
      values = pickNonNull(values, []);
    } else {
      values = [values];
    }

    return this.whereIn(knexBuilder, col, values);
  }

  whereIn(knexBuilder: knex.Knex.QueryBuilder, col: string, val: nany) {
    if (this.prefix === 'not') {
      return knexBuilder.whereNotIn(col, val);
    } else {
      return knexBuilder.whereIn(col, val);
    }
  }

  override cloneInto(
    clone: WhereInCompositeMsSqlOperation,
  ): QueryBuilderOperation {
    super.cloneInto(clone);
    clone.prefix = this.prefix;
    return clone;
  }

  override clone(): WhereInCompositeMsSqlOperation {
    return this.cloneInto(
      new WhereInCompositeMsSqlOperation(this.name, this.opt),
    ) as WhereInCompositeMsSqlOperation;
  }
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
