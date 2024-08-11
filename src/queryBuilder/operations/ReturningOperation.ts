import { Knex } from 'knex';
import { nany } from '../../ninja.ts';
import { flatten } from '../../utils/object.ts';
import { ObjectionToKnexConvertingOperation } from './ObjectionToKnexConvertingOperation.ts';
import { HasOnAdd, HasOnBuildKnex } from './QueryBuilderOperation.ts';

// This class's only purpose is to normalize the arguments into an array.
//
// In knex, if a single column is given to `returning` it returns an array with the that column's value
// in it. If an array is given with a one item inside, the return value is an object.
export class ReturningOperation extends ObjectionToKnexConvertingOperation
  implements HasOnAdd, HasOnBuildKnex {
  override onAdd(builder: nany, ...args: nany[]) {
    args = flatten(args);

    // Don't add an empty returning list.
    if (args.length === 0) {
      return false;
    }

    return super.onAdd(builder, args);
  }

  onBuildKnex(
    knexBuilder: Knex.QueryBuilder,
    builder: nany,
  ): Knex.QueryBuilder {
    // Always pass an array of columns to knex.returning.
    return knexBuilder.returning(this.getKnexArgs(builder));
  }
}
