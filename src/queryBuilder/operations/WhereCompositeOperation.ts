import { ObjectionToKnexConvertingOperation } from './ObjectionToKnexConvertingOperation.ts';
import { asSingle } from '../../utils/object.ts';
import { HasOnBuildKnex } from './QueryBuilderOperation.ts';
import { Knex } from 'knex';
import { nany } from '../../ninja.ts';
import { ComparisonOperator } from '../../types/ComparaisonOperator.ts';
import { Column, Value } from '../../types/Knex.ts';

export class WhereCompositeOperation extends ObjectionToKnexConvertingOperation
  implements HasOnBuildKnex {
  /**
   * Builds a Knex query using the provided builder and arguments.
   *
   * @param knexBuilder - The Knex query builder.
   * @param builder - The builder object.
   * @returns The Knex query builder with the appropriate where conditions applied.
   * @throws Error if the number of arguments is invalid or if the dimensions of cols and values are not the same.
   */
  onBuildKnex(knexBuilder: Knex.QueryBuilder, builder: nany) {
    const args = this.getKnexArgs(builder);

    if (args.length === 2) {
      // Convert whereComposite('foo', 1) into whereComposite('foo', '=', 1)
      args.splice(1, 0, '=');
    } else if (args.length !== 3) {
      throw new Error(`invalid number of arguments ${args.length}`);
    }

    const [cols, op, values] = args as [
      Column | Column[],
      ComparisonOperator,
      Value | Value[],
    ];

    if (isNormalWhere(cols, values)) {
      return knexBuilder.where(...buildNormalWhereArgs(cols, op, values));
    } else if (isCompositeWhere(cols, values)) {
      return knexBuilder.where(
        ...buildCompositeWhereArgs(cols as Column[], op, values as Value[]),
      );
    } else {
      throw new Error(`both cols and values must have same dimensions`);
    }
  }
}

/**
 * Determines if the provided columns and values are considered normal for a WHERE clause.
 *
 * @param {Column | Column[]} cols - The columns to check.
 * @param {Value | Value[]} values - The values to check.
 * @returns {boolean} - Returns true if the columns and values are normal, false otherwise.
 */
function isNormalWhere(
  cols: Column | Column[],
  values: Value | Value[],
): boolean {
  return (
    (!Array.isArray(cols) || cols.length === 1) &&
    (!Array.isArray(values) || values.length === 1)
  );
}

/**
 * Builds the arguments for a normal WHERE clause.
 *
 * @param cols - The column(s) to compare.
 * @param op - The comparison operator.
 * @param values - The value(s) to compare against.
 * @returns An array containing the column, comparison operator, and value.
 */
function buildNormalWhereArgs(
  cols: Column | Column[],
  op: ComparisonOperator,
  values: Value | Value[],
): [Column, ComparisonOperator, Value] {
  return [asSingle(cols), op, asSingle(values)];
}

/**
 * Checks if the provided columns and values are composite for a where operation.
 *
 * @param {Column | Column[]} cols - The columns to check.
 * @param {Value | Value[]} values - The values to check.
 * @returns {boolean} - Returns true if the columns and values are composite, false otherwise.
 */
function isCompositeWhere(
  cols: Column | Column[],
  values: Value | Value[],
): boolean {
  return Array.isArray(cols) && Array.isArray(values) &&
    cols.length === values.length;
}

/**
 * Builds a composite where clause for a Knex query builder.
 *
 * @param cols - The columns to compare.
 * @param op - The comparison operator.
 * @param values - The values to compare against.
 * @returns An array containing a Knex query callback function that applies the composite where clause.
 */
function buildCompositeWhereArgs(
  cols: Column[],
  op: ComparisonOperator,
  values: Value[],
): [Knex.QueryCallback] {
  return [
    (builder: Knex.QueryBuilder) => {
      for (let i = 0, l = cols.length; i < l; ++i) {
        builder.where(cols[i], op, values[i]);
      }
    },
  ];
}
