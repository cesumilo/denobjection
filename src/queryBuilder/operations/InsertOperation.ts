import {
  HasOnAdd,
  HasOnAfter1,
  HasOnAfter2,
  HasOnBefore2,
  HasOnBuildKnex,
  HasToFindOperation,
  QueryBuilderOperation,
} from './QueryBuilderOperation.ts';
import { StaticHookArguments } from '../StaticHookArguments.ts';
import { after, mapAfterAllReturn } from '../../utils/promiseUtils/index.ts';
import { isMsSql, isMySql, isPostgres, isSqlite } from '../../utils/knex.ts';
import { isObject } from '../../utils/object.ts';
import { nany } from '../../ninja.ts';

// Base class for all insert operations.
export class InsertOperation extends QueryBuilderOperation
  implements
    HasOnAdd,
    HasOnBefore2,
    HasOnBuildKnex,
    HasOnAfter1,
    HasOnAfter2,
    HasToFindOperation {
  models?: nany[];
  isArray: boolean;
  modelOptions: nany;

  constructor(name: string, opt: nany) {
    super(name, opt);

    this.isArray = false;
    this.modelOptions = Object.assign({}, this.opt.modelOptions || {});
  }

  onAdd(builder: nany, ...args: nany[]) {
    const json = args[0];
    const modelClass = builder.modelClass();

    this.isArray = Array.isArray(json);
    this.models = modelClass.ensureModelArray(json, this.modelOptions);

    return true;
  }

  async onBefore2(builder: nany, result: nany) {
    if (
      this.models?.length && this.models.length > 1 &&
      !isPostgres(builder.knex()) &&
      !isMsSql(builder.knex())
    ) {
      throw new Error('batch insert only works with Postgresql and SQL Server');
    } else {
      await callBeforeInsert(builder, this.models || []); // TODO check why this.models can be null
      return result;
    }
  }

  onBuildKnex(knexBuilder: nany, builder: nany) {
    if (
      !isSqlite(builder.knex()) && !isMySql(builder.knex()) &&
      !builder.has(/returning/)
    ) {
      // If the user hasn't specified a `returning` clause, we make sure
      // that at least the identifier is returned.
      knexBuilder = knexBuilder.returning(builder.modelClass().getIdColumn());
    }

    return knexBuilder.insert(
      this.models?.map((model) => model.$toDatabaseJson(builder)),
    );
  }

  onAfter1(_: nany, ret: nany) {
    if (!Array.isArray(ret) || !ret.length || ret === this.models) {
      // Early exit if there is nothing to do.
      return this.models;
    }

    if (isObject(ret[0]) && this.models) {
      // If the user specified a `returning` clause the result may be an array of objects.
      // Merge all values of the objects to our models.
      for (let i = 0, l = this.models.length; i < l; ++i) {
        this.models[i].$setDatabaseJson(ret[i]);
      }
    } else if (this.models) {
      // If the return value is not an array of objects, we assume it is an array of identifiers.
      for (let i = 0, l = this.models.length; i < l; ++i) {
        const model = this.models[i];

        // Don't set the id if the model already has one. MySQL and Sqlite don't return the correct
        // primary key value if the id is not generated in db, but given explicitly.
        if (!model.$id()) {
          model.$id(ret[i]);
        }
      }
    }

    return this.models;
  }

  onAfter2(builder: nany, models: nany[]) {
    const result = this.isArray ? models : models[0] || null;
    return callAfterInsert(builder, this.models || [], result); // TODO check why this.models can be null
  }

  toFindOperation() {
    return null;
  }

  override clone(): InsertOperation {
    return this.cloneInto(
      new InsertOperation(this.name, this.opt),
    ) as InsertOperation;
  }

  override cloneInto(clone: QueryBuilderOperation): QueryBuilderOperation {
    super.cloneInto(clone);

    (clone as InsertOperation).models = this.models;
    (clone as InsertOperation).isArray = this.isArray;

    return clone;
  }
}

function callBeforeInsert(builder: nany, models: nany[]) {
  const maybePromise = callInstanceBeforeInsert(builder, models);
  return after(maybePromise, () => callStaticBeforeInsert(builder));
}

function callInstanceBeforeInsert(builder: nany, models: nany[]) {
  return mapAfterAllReturn(
    models,
    (model) => model.$beforeInsert(builder.context()),
    models,
  );
}

function callStaticBeforeInsert(builder: nany) {
  const args = StaticHookArguments.create({ builder });
  return builder.modelClass().beforeInsert(args);
}

function callAfterInsert(builder: nany, models: nany[], result: nany) {
  const maybePromise = callInstanceAfterInsert(builder, models);
  return after(maybePromise, () => callStaticAfterInsert(builder, result));
}

function callInstanceAfterInsert(builder: nany, models: nany) {
  return mapAfterAllReturn(
    models,
    (model: nany) => model.$afterInsert(builder.context()),
    models,
  );
}

function callStaticAfterInsert(builder: nany, result: nany) {
  const args = StaticHookArguments.create({ builder, result });
  const maybePromise = builder.modelClass().afterInsert(args);

  return after(maybePromise, (maybeResult) => {
    if (maybeResult === undefined) {
      return result;
    } else {
      return maybeResult;
    }
  });
}
