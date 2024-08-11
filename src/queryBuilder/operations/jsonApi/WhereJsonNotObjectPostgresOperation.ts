import * as jsonApi from './postgresJsonApi.ts';
import { ObjectionToKnexConvertingOperation } from '../ObjectionToKnexConvertingOperation.ts';
import { Knex } from 'knex';
import { nany } from '../../../ninja.ts';
import { HasOnBuildKnex } from '../QueryBuilderOperation.ts';

export class WhereJsonNotObjectPostgresOperation
  extends ObjectionToKnexConvertingOperation
  implements HasOnBuildKnex {
  onBuildKnex(knexBuilder: Knex.QueryBuilder, builder: nany) {
    return this.whereJsonNotObject(
      knexBuilder,
      builder.knex(),
      this.getKnexArgs(builder)[0],
    );
  }

  whereJsonNotObject(
    knexBuilder: Knex.QueryBuilder,
    knex: Knex,
    fieldExpression: string,
  ) {
    const innerQuery = (innerQuery: nany) => {
      const builder = jsonApi.whereJsonbRefOnLeftJsonbValOrRefOnRight(
        innerQuery,
        fieldExpression,
        '@>',
        this.opt.compareValue,
        'not',
      );

      builder.orWhereRaw(
        jsonApi.whereJsonFieldQuery(knex, fieldExpression, 'IS', null),
      );
    };

    if (this.opt.bool === 'or') {
      knexBuilder = knexBuilder.orWhere(innerQuery);
    } else {
      knexBuilder = knexBuilder.where(innerQuery);
    }

    return knexBuilder;
  }
}
