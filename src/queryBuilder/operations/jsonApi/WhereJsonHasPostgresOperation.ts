import * as jsonApi from './postgresJsonApi.ts';
import { ObjectionToKnexConvertingOperation } from '../ObjectionToKnexConvertingOperation.ts';
import { Knex } from 'knex';
import { HasOnBuildKnex } from '../QueryBuilderOperation.ts';
import { nany } from '../../../ninja.ts';

export class WhereJsonHasPostgresOperation
  extends ObjectionToKnexConvertingOperation
  implements HasOnBuildKnex {
  onBuildKnex(knexBuilder: Knex.QueryBuilder, builder: nany) {
    const args = this.getKnexArgs(builder);

    const sql = jsonApi.whereJsonFieldRightStringArrayOnLeftQuery(
      builder.knex(),
      args[0],
      this.opt.operator,
      args[1],
    );

    if (this.opt.bool === 'or') {
      knexBuilder = knexBuilder.orWhereRaw(sql);
    } else {
      knexBuilder = knexBuilder.whereRaw(sql);
    }

    return knexBuilder;
  }
}
