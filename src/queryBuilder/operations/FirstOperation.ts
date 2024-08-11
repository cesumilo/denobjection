import knex from 'knex';
import {
  HasOnAfter3,
  HasOnBuildKnex,
  QueryBuilderOperation,
} from './QueryBuilderOperation.ts';
import { nany } from '../../ninja.ts';

export class FirstOperation extends QueryBuilderOperation
  implements HasOnBuildKnex, HasOnAfter3 {
  onBuildKnex(knexBuilder: knex.Knex.QueryBuilder<any, any[]>, builder: nany) {
    const modelClass = builder.modelClass();

    if (builder.isFind() && modelClass.useLimitInFirst) {
      knexBuilder = knexBuilder.limit(1);
    }

    return knexBuilder;
  }

  onAfter3(_: nany, result: nany) {
    if (Array.isArray(result)) {
      return result[0];
    } else {
      return result;
    }
  }
}
