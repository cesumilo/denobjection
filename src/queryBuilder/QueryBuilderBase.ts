import {
  IModel,
  QueryBuilderOperationSupport,
} from './QueryBuilderOperationSupport.ts';
import { isMsSql, isSqlite } from '../utils/knex.ts';
import { KnexOperation } from './operations/KnexOperation.ts';
import { MergeOperation } from './operations/MergeOperation.ts';
import { SelectOperation } from './operations/select/SelectOperation.ts';
import { ReturningOperation } from './operations/ReturningOperation.ts';
import { WhereCompositeOperation } from './operations/WhereCompositeOperation.ts';
import { WhereJsonPostgresOperation } from './operations/jsonApi/WhereJsonPostgresOperation.ts';

import {
  WhereInCompositeOperation,
} from './operations/whereInComposite/WhereInCompositeOperation.ts';
import {
  WhereInCompositeSqliteOperation,
} from './operations/whereInComposite/WhereInCompositeSqliteOperation.ts';
import {
  WhereInCompositeMsSqlOperation,
} from './operations/whereInComposite/WhereInCompositeMsSqlOperation.ts';
import {
  WhereJsonHasPostgresOperation,
} from './operations/jsonApi/WhereJsonHasPostgresOperation.ts';
import {
  WhereJsonNotObjectPostgresOperation,
} from './operations/jsonApi/WhereJsonNotObjectPostgresOperation.ts';
import { nany } from '../ninja.ts';
import knex from 'knex';
import { FieldExpression } from '../../typings/objection/index.d.ts';

export class QueryBuilderBase<T extends IModel>
  extends QueryBuilderOperationSupport<T> {
  modify(...args: nany[]): this {
    const func = args[0];

    if (!func) {
      return this;
    }

    if (args.length === 1) {
      func.call(this, this);
    } else {
      args[0] = this;
      func(...args);
    }

    return this;
  }

  transacting(trx?: knex.Knex.Transaction): this {
    this._context.knex = trx;
    return this;
  }

  select(...args: nany[]) {
    return this.addOperation(new SelectOperation('select'), ...args);
  }

  insert(...args: nany[]) {
    return this.addOperation(new KnexOperation('insert'), ...args);
  }

  update(...args: nany[]) {
    return this.addOperation(new KnexOperation('update'), ...args);
  }

  delete(...args: nany[]) {
    return this.addOperation(new KnexOperation('delete'), ...args);
  }

  del(...args: nany[]) {
    return this.delete(...args);
  }

  forUpdate(...args: nany[]) {
    return this.addOperation(new KnexOperation('forUpdate'), ...args);
  }

  forShare(...args: nany[]) {
    return this.addOperation(new KnexOperation('forShare'), ...args);
  }

  forNoKeyUpdate(...args: nany[]) {
    return this.addOperation(new KnexOperation('forNoKeyUpdate'), ...args);
  }

  forKeyShare(...args: nany[]) {
    return this.addOperation(new KnexOperation('forKeyShare'), ...args);
  }

  skipLocked(...args: nany[]) {
    return this.addOperation(new KnexOperation('skipLocked'), ...args);
  }

  noWait(...args: nany[]) {
    return this.addOperation(new KnexOperation('noWait'), ...args);
  }

  as(...args: nany[]) {
    return this.addOperation(new KnexOperation('as'), ...args);
  }

  columns(...args: nany[]) {
    return this.addOperation(new SelectOperation('columns'), ...args);
  }

  column(...args: nany[]) {
    return this.addOperation(new SelectOperation('column'), ...args);
  }

  from(...args: nany[]) {
    return this.addOperation(new KnexOperation('from'), ...args);
  }

  fromJS(...args: nany[]) {
    return this.addOperation(new KnexOperation('fromJS'), ...args);
  }

  fromRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('fromRaw'), ...args);
  }

  into(...args: nany[]) {
    return this.addOperation(new KnexOperation('into'), ...args);
  }

  withSchema(...args: nany[]) {
    return this.addOperation(new KnexOperation('withSchema'), ...args);
  }

  table(...args: nany[]) {
    return this.addOperation(new KnexOperation('table'), ...args);
  }

  distinct(...args: nany[]) {
    return this.addOperation(new SelectOperation('distinct'), ...args);
  }

  distinctOn(...args: nany[]) {
    return this.addOperation(new SelectOperation('distinctOn'), ...args);
  }

  join(...args: nany[]) {
    return this.addOperation(new KnexOperation('join'), ...args);
  }

  joinRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('joinRaw'), ...args);
  }

  innerJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('innerJoin'), ...args);
  }

  leftJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('leftJoin'), ...args);
  }

  leftOuterJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('leftOuterJoin'), ...args);
  }

  rightJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('rightJoin'), ...args);
  }

  rightOuterJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('rightOuterJoin'), ...args);
  }

  outerJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('outerJoin'), ...args);
  }

  fullOuterJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('fullOuterJoin'), ...args);
  }

  crossJoin(...args: nany[]) {
    return this.addOperation(new KnexOperation('crossJoin'), ...args);
  }

  where(...args: nany[]) {
    return this.addOperation(new KnexOperation('where'), ...args);
  }

  andWhere(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhere'), ...args);
  }

  orWhere(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhere'), ...args);
  }

  whereNot(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNot'), ...args);
  }

  andWhereNot(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereNot'), ...args);
  }

  orWhereNot(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereNot'), ...args);
  }

  whereRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereRaw'), ...args);
  }

  andWhereRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereRaw'), ...args);
  }

  orWhereRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereRaw'), ...args);
  }

  whereWrapped(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereWrapped'), ...args);
  }

  havingWrapped(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingWrapped'), ...args);
  }

  whereExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereExists'), ...args);
  }

  orWhereExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereExists'), ...args);
  }

  whereNotExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNotExists'), ...args);
  }

  orWhereNotExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereNotExists'), ...args);
  }

  whereIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereIn'), ...args);
  }

  orWhereIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereIn'), ...args);
  }

  whereNotIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNotIn'), ...args);
  }

  orWhereNotIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereNotIn'), ...args);
  }

  whereNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNull'), ...args);
  }

  orWhereNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereNull'), ...args);
  }

  whereNotNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNotNull'), ...args);
  }

  orWhereNotNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereNotNull'), ...args);
  }

  whereBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereBetween'), ...args);
  }

  andWhereBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereBetween'), ...args);
  }

  whereNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNotBetween'), ...args);
  }

  andWhereNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereNotBetween'), ...args);
  }

  orWhereBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereBetween'), ...args);
  }

  orWhereNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereNotBetween'), ...args);
  }

  whereLike(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereLike'), ...args);
  }

  andWhereLike(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereLike'), ...args);
  }

  orWhereLike(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereLike'), ...args);
  }

  whereILike(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereILike'), ...args);
  }

  andWhereILike(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereILike'), ...args);
  }

  orWhereILike(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereILike'), ...args);
  }

  groupBy(...args: nany[]) {
    return this.addOperation(new KnexOperation('groupBy'), ...args);
  }

  groupByRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('groupByRaw'), ...args);
  }

  orderBy(...args: nany[]) {
    return this.addOperation(new KnexOperation('orderBy'), ...args);
  }

  orderByRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('orderByRaw'), ...args);
  }

  union(...args: nany[]) {
    return this.addOperation(new KnexOperation('union'), ...args);
  }

  unionAll(...args: nany[]) {
    return this.addOperation(new KnexOperation('unionAll'), ...args);
  }

  intersect(...args: nany[]) {
    return this.addOperation(new KnexOperation('intersect'), ...args);
  }

  except(...args: nany[]) {
    return this.addOperation(new KnexOperation('except'), ...args);
  }

  having(...args: nany[]) {
    return this.addOperation(new KnexOperation('having'), ...args);
  }

  clearHaving(...args: nany[]) {
    return this.addOperation(new KnexOperation('clearHaving'), ...args);
  }

  clearGroup(...args: nany[]) {
    return this.addOperation(new KnexOperation('clearGroup'), ...args);
  }

  orHaving(...args: nany[]) {
    return this.addOperation(new KnexOperation('orHaving'), ...args);
  }

  havingIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingIn'), ...args);
  }

  orHavingIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingIn'), ...args);
  }

  havingNotIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingNotIn'), ...args);
  }

  orHavingNotIn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orHavingNotIn'), ...args);
  }

  havingNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingNull'), ...args);
  }

  orHavingNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('orHavingNull'), ...args);
  }

  havingNotNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingNotNull'), ...args);
  }

  orHavingNotNull(...args: nany[]) {
    return this.addOperation(new KnexOperation('orHavingNotNull'), ...args);
  }

  havingExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingExists'), ...args);
  }

  orHavingExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('orHavingExists'), ...args);
  }

  havingNotExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingNotExists'), ...args);
  }

  orHavingNotExists(...args: nany[]) {
    return this.addOperation(new KnexOperation('orHavingNotExists'), ...args);
  }

  havingBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingBetween'), ...args);
  }

  orHavingBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingBetween'), ...args);
  }

  havingNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingNotBetween'), ...args);
  }

  orHavingNotBetween(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingNotBetween'), ...args);
  }

  havingRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('havingRaw'), ...args);
  }

  orHavingRaw(...args: nany[]) {
    return this.addOperation(new KnexOperation('orHavingRaw'), ...args);
  }

  offset(...args: nany[]) {
    return this.addOperation(new KnexOperation('offset'), ...args);
  }

  limit(...args: nany[]) {
    return this.addOperation(new KnexOperation('limit'), ...args);
  }

  count(...args: nany[]) {
    return this.addOperation(new SelectOperation('count'), ...args);
  }

  countDistinct(...args: nany[]) {
    return this.addOperation(new SelectOperation('countDistinct'), ...args);
  }

  min(...args: nany[]) {
    return this.addOperation(new SelectOperation('min'), ...args);
  }

  max(...args: nany[]) {
    return this.addOperation(new SelectOperation('max'), ...args);
  }

  sum(...args: nany[]) {
    return this.addOperation(new SelectOperation('sum'), ...args);
  }

  sumDistinct(...args: nany[]) {
    return this.addOperation(new SelectOperation('sumDistinct'), ...args);
  }

  avg(...args: nany[]) {
    return this.addOperation(new SelectOperation('avg'), ...args);
  }

  avgDistinct(...args: nany[]) {
    return this.addOperation(new SelectOperation('avgDistinct'), ...args);
  }

  debug(...args: nany[]) {
    return this.addOperation(new KnexOperation('debug'), ...args);
  }

  returning(...args: nany[]) {
    return this.addOperation(new ReturningOperation('returning'), ...args);
  }

  truncate(...args: nany[]) {
    return this.addOperation(new KnexOperation('truncate'), ...args);
  }

  connection(...args: nany[]) {
    return this.addOperation(new KnexOperation('connection'), ...args);
  }

  options(...args: nany[]) {
    return this.addOperation(new KnexOperation('options'), ...args);
  }

  columnInfo(...args: nany[]) {
    return this.addOperation(new KnexOperation('columnInfo'), ...args);
  }

  off(...args: nany[]) {
    return this.addOperation(new KnexOperation('off'), ...args);
  }

  timeout(...args: nany[]) {
    return this.addOperation(new KnexOperation('timeout'), ...args);
  }

  with(...args: nany[]) {
    return this.addOperation(new KnexOperation('with'), ...args);
  }

  withWrapped(...args: nany[]) {
    return this.addOperation(new KnexOperation('withWrapped'), ...args);
  }

  withRecursive(...args: nany[]) {
    return this.addOperation(new KnexOperation('withRecursive'), ...args);
  }

  withMaterialized(...args: nany[]) {
    return this.addOperation(new KnexOperation('withMaterialized'), ...args);
  }

  withNotMaterialized(...args: nany[]) {
    return this.addOperation(new KnexOperation('withNotMaterialized'), ...args);
  }

  whereComposite(...args: nany[]) {
    return this.addOperation(
      new WhereCompositeOperation('whereComposite'),
      args,
    );
  }

  whereInComposite(...args: nany[]) {
    let operation = null;

    if (isSqlite(this.knex())) {
      operation = new WhereInCompositeSqliteOperation('whereInComposite');
    } else if (isMsSql(this.knex())) {
      operation = new WhereInCompositeMsSqlOperation('whereInComposite');
    } else {
      operation = new WhereInCompositeOperation('whereInComposite');
    }

    return this.addOperation(operation, ...args);
  }

  whereNotInComposite(...args: nany[]) {
    let operation = null;

    if (isSqlite(this.knex())) {
      operation = new WhereInCompositeSqliteOperation('whereNotInComposite', {
        prefix: 'not',
      });
    } else if (isMsSql(this.knex())) {
      operation = new WhereInCompositeMsSqlOperation('whereNotInComposite', {
        prefix: 'not',
      });
    } else {
      operation = new WhereInCompositeOperation('whereNotInComposite', {
        prefix: 'not',
      });
    }

    return this.addOperation(operation, ...args);
  }

  jsonExtract(...args: nany[]) {
    return this.addOperation(new KnexOperation('jsonExtract'), ...args);
  }

  jsonSet(...args: nany[]) {
    return this.addOperation(new KnexOperation('jsonSet'), ...args);
  }

  jsonInsert(...args: nany[]) {
    return this.addOperation(new KnexOperation('jsonInsert'), ...args);
  }

  jsonRemove(...args: nany[]) {
    return this.addOperation(new KnexOperation('jsonRemove'), ...args);
  }

  whereJsonObject(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereJsonObject'), ...args);
  }

  orWhereJsonObject(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereJsonObject'), ...args);
  }

  andWhereJsonObject(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereJsonObject'), ...args);
  }

  whereNotJsonObject(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNotJsonObject'), ...args);
  }

  orWhereNotJsonObject(...args: nany[]) {
    return this.addOperation(
      new KnexOperation('orWhereNotJsonObject'),
      ...args,
    );
  }

  andWhereNotJsonObject(...args: nany[]) {
    return this.addOperation(
      new KnexOperation('andWhereNotJsonObject'),
      ...args,
    );
  }

  whereJsonPath(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereJsonPath'), ...args);
  }

  orWhereJsonPath(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereJsonPath'), ...args);
  }

  andWhereJsonPath(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereJsonPath'), ...args);
  }

  // whereJson(Not)SupersetOf / whereJson(Not)SubsetOf are now supported by knex >= 1.0, but for now
  // objection handles them differently and only for postgres.
  // Changing them to utilize knex methods directly may require a major version bump and upgrade guide.
  whereJsonSupersetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('whereJsonSupersetOf', {
        operator: '@>',
        bool: 'and',
      }),
      args,
    );
  }

  andWhereJsonSupersetOf(...args: nany[]) {
    return this.whereJsonSupersetOf(...args);
  }

  orWhereJsonSupersetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('orWhereJsonSupersetOf', {
        operator: '@>',
        bool: 'or',
      }),
      args,
    );
  }

  whereJsonNotSupersetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('whereJsonNotSupersetOf', {
        operator: '@>',
        bool: 'and',
        prefix: 'not',
      }),
      args,
    );
  }

  andWhereJsonNotSupersetOf(...args: nany[]) {
    return this.whereJsonNotSubsetOf(...args);
  }

  orWhereJsonNotSupersetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('orWhereJsonNotSupersetOf', {
        operator: '@>',
        bool: 'or',
        prefix: 'not',
      }),
      args,
    );
  }

  whereJsonSubsetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('whereJsonSubsetOf', {
        operator: '<@',
        bool: 'and',
      }),
      args,
    );
  }

  andWhereJsonSubsetOf(...args: nany[]) {
    return this.whereJsonSubsetOf(...args);
  }

  orWhereJsonSubsetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('orWhereJsonSubsetOf', {
        operator: '<@',
        bool: 'or',
      }),
      args,
    );
  }

  whereJsonNotSubsetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('whereJsonNotSubsetOf', {
        operator: '<@',
        bool: 'and',
        prefix: 'not',
      }),
      args,
    );
  }

  andWhereJsonNotSubsetOf(...args: nany[]) {
    return this.whereJsonNotSubsetOf(...args);
  }

  orWhereJsonNotSubsetOf(...args: nany[]) {
    return this.addOperation(
      new WhereJsonPostgresOperation('orWhereJsonNotSubsetOf', {
        operator: '<@',
        bool: 'or',
        prefix: 'not',
      }),
      args,
    );
  }

  whereJsonNotArray(...args: nany[]) {
    return this.addOperation(
      new WhereJsonNotObjectPostgresOperation('whereJsonNotArray', {
        bool: 'and',
        compareValue: [],
      }),
      args,
    );
  }

  orWhereJsonNotArray(...args: nany[]) {
    return this.addOperation(
      new WhereJsonNotObjectPostgresOperation('orWhereJsonNotArray', {
        bool: 'or',
        compareValue: [],
      }),
      args,
    );
  }

  whereJsonNotObject(...args: nany[]) {
    return this.addOperation(
      new WhereJsonNotObjectPostgresOperation('whereJsonNotObject', {
        bool: 'and',
        compareValue: {},
      }),
      args,
    );
  }

  orWhereJsonNotObject(...args: nany[]) {
    return this.addOperation(
      new WhereJsonNotObjectPostgresOperation('orWhereJsonNotObject', {
        bool: 'or',
        compareValue: {},
      }),
      args,
    );
  }

  whereJsonHasAny(...args: nany[]) {
    return this.addOperation(
      new WhereJsonHasPostgresOperation('whereJsonHasAny', {
        bool: 'and',
        operator: '?|',
      }),
      args,
    );
  }

  orWhereJsonHasAny(...args: nany[]) {
    return this.addOperation(
      new WhereJsonHasPostgresOperation('orWhereJsonHasAny', {
        bool: 'or',
        operator: '?|',
      }),
      args,
    );
  }

  whereJsonHasAll(...args: nany[]) {
    return this.addOperation(
      new WhereJsonHasPostgresOperation('whereJsonHasAll', {
        bool: 'and',
        operator: '?&',
      }),
      args,
    );
  }

  orWhereJsonHasAll(...args: nany[]) {
    return this.addOperation(
      new WhereJsonHasPostgresOperation('orWhereJsonHasAll', {
        bool: 'or',
        operator: '?&',
      }),
      args,
    );
  }

  whereJsonIsArray(fieldExpression: FieldExpression) {
    return this.whereJsonSupersetOf(fieldExpression, []);
  }

  orWhereJsonIsArray(fieldExpression: FieldExpression) {
    return this.orWhereJsonSupersetOf(fieldExpression, []);
  }

  whereJsonIsObject(fieldExpression: FieldExpression) {
    return this.whereJsonSupersetOf(fieldExpression, {});
  }

  orWhereJsonIsObject(fieldExpression: FieldExpression) {
    return this.orWhereJsonSupersetOf(fieldExpression, {});
  }

  whereColumn(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereColumn'), ...args);
  }

  andWhereColumn(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereColumn'), ...args);
  }

  orWhereColumn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereColumn'), ...args);
  }

  whereNotColumn(...args: nany[]) {
    return this.addOperation(new KnexOperation('whereNotColumn'), ...args);
  }

  andWhereNotColumn(...args: nany[]) {
    return this.addOperation(new KnexOperation('andWhereNotColumn'), ...args);
  }

  orWhereNotColumn(...args: nany[]) {
    return this.addOperation(new KnexOperation('orWhereNotColumn'), ...args);
  }

  onConflict(...args: nany[]) {
    return this.addOperation(new KnexOperation('onConflict'), ...args);
  }

  ignore(...args: nany[]) {
    return this.addOperation(new KnexOperation('ignore'), ...args);
  }

  merge(...args: nany[]) {
    return this.addOperation(new MergeOperation('merge'), ...args);
  }
}
