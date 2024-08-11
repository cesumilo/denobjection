import * as jsonApi from './postgresJsonApi.ts';
import { ObjectionToKnexConvertingOperation } from '../ObjectionToKnexConvertingOperation.ts';
import { HasOnBuildKnex } from '../QueryBuilderOperation.ts';
import { nany } from '../../../ninja.ts';
import { Knex } from 'knex';

export class WhereJsonPostgresOperation
  extends ObjectionToKnexConvertingOperation
  implements HasOnBuildKnex {
  onBuildKnex(knexBuilder: Knex.QueryBuilder, builder: nany) {
    const args = this.getKnexArgs(builder);

    const rawArgs = jsonApi
      .whereJsonbRefOnLeftJsonbValOrRefOnRightRawQueryParams(
        args[0],
        this.opt.operator,
        args[1],
        this.opt.prefix,
      );

    if (this.opt.bool === 'or') {
      knexBuilder = knexBuilder.orWhereRaw.apply(knexBuilder, rawArgs as nany); // TODO - type
    } else {
      knexBuilder = knexBuilder.whereRaw.apply(knexBuilder, rawArgs as nany); // TODO - type
    }

    return knexBuilder;
  }
}
