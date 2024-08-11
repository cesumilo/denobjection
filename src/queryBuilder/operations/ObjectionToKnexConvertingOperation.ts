import { HasOnAdd, QueryBuilderOperation } from './QueryBuilderOperation.ts';
import { isFunction, isObject, isPlainObject } from '../../utils/object.ts';
import { isKnexJoinBuilder, isKnexQueryBuilder } from '../../utils/knex.ts';
import { transformation } from '../transformations/index.ts';
import { JoinBuilder } from '../JoinBuilder.ts';
import { nany } from '../../ninja.ts';

// An abstract operation base class that converts all arguments from objection types
// to knex types. For example objection query builders are converted into knex query
// builders and objection RawBuilder instances are converted into knex Raw instances.
export class ObjectionToKnexConvertingOperation extends QueryBuilderOperation
  implements HasOnAdd {
  protected args: nany[];

  constructor(name: string, opt: nany = {}) {
    super(name, opt);
    this.args = [];
  }

  getKnexArgs(builder: nany) {
    return convertArgs(this.name, builder, this.args);
  }

  onAdd(builder: nany, args: nany[]) {
    this.args = Array.from(args);
    return shouldBeAdded(this.name, builder, this.args);
  }

  override clone() {
    const clone = new ObjectionToKnexConvertingOperation(this.name, this.opt);
    return this.cloneInto(clone);
  }

  override cloneInto(
    clone: ObjectionToKnexConvertingOperation,
  ): QueryBuilderOperation {
    super.cloneInto(clone);
    clone.args = this.args;
    return clone;
  }
}

function shouldBeAdded(opName: string, builder: nany, args: nany[]) {
  const skipUndefined = builder.internalOptions().skipUndefined;

  for (let i = 0, l = args.length; i < l; ++i) {
    const arg = args[i];

    if (isUndefined(arg)) {
      if (skipUndefined) {
        return false;
      } else {
        throw new Error(
          `undefined passed as argument #${i} for '${opName}' operation. Call skipUndefined() method to ignore the undefined values.`,
        );
      }
    }
  }

  return true;
}

function convertArgs(opName: string, builder: nany, args: nany[]) {
  const skipUndefined = builder.internalOptions().skipUndefined;

  return args.map((arg, i) => {
    if (hasToKnexRawMethod(arg)) {
      return convertToKnexRaw(arg, builder);
    } else if (isObjectionQueryBuilderBase(arg)) {
      return convertQueryBuilderBase(arg, builder);
    } else if (isArray(arg)) {
      return convertArray(arg, builder, i, opName, skipUndefined);
    } else if (isFunction(arg)) {
      return convertFunction(arg, builder);
    } else if (isModel(arg)) {
      return convertModel(arg);
    } else if (isPlainObject(arg)) {
      return convertPlainObject(arg, builder, i, opName, skipUndefined);
    } else {
      return arg;
    }
  });
}

function isUndefined(item: nany) {
  return item === undefined;
}

function hasToKnexRawMethod(item: nany) {
  return isObject(item) && isFunction(item.toKnexRaw);
}

function convertToKnexRaw(item: nany, builder: nany) {
  return item.toKnexRaw(builder);
}

function isObjectionQueryBuilderBase(item: nany) {
  return isObject(item) && item.isObjectionQueryBuilderBase === true;
}

function convertQueryBuilderBase(item: nany, builder: nany) {
  item = transformation.onConvertQueryBuilderBase(item, builder);
  return item.subqueryOf(builder).toKnexQuery();
}

function isArray(item: nany) {
  return Array.isArray(item);
}

function convertArray(
  arr: nany[],
  builder: nany,
  i: nany,
  opName: string,
  skipUndefined: boolean,
) {
  return arr.map((item) => {
    if (item === undefined) {
      if (!skipUndefined) {
        throw new Error(
          `undefined passed as an item in argument #${i} for '${opName}' operation. Call skipUndefined() method to ignore the undefined values.`,
        );
      }
    } else if (hasToKnexRawMethod(item)) {
      return convertToKnexRaw(item, builder);
    } else if (isObjectionQueryBuilderBase(item)) {
      return convertQueryBuilderBase(item, builder);
    } else {
      return item;
    }
  });
}

function convertFunction(func: (...args: nany[]) => nany, builder: nany) {
  return function convertedKnexArgumentFunction(this: any, ...args: nany[]) {
    if (isKnexQueryBuilder(this)) {
      convertQueryBuilderFunction(this, func, builder);
    } else if (isKnexJoinBuilder(this)) {
      convertJoinBuilderFunction(this, func, builder);
    } else {
      return func.apply(this, args);
    }
  };
}

function convertQueryBuilderFunction(
  knexQueryBuilder: nany,
  func: (...args: nany[]) => nany,
  builder: nany,
) {
  const convertedQueryBuilder = builder.constructor.forClass(
    builder.modelClass(),
  );

  convertedQueryBuilder.isPartial(true).subqueryOf(builder);
  func.call(convertedQueryBuilder, convertedQueryBuilder);

  convertedQueryBuilder.toKnexQuery(knexQueryBuilder);
}

function convertJoinBuilderFunction(
  knexJoinBuilder: nany,
  func: (...args: nany[]) => nany,
  builder: nany,
) {
  const joinClauseBuilder = JoinBuilder.forClass(builder.modelClass());

  joinClauseBuilder.isPartial(true).subqueryOf(builder);
  func.call(joinClauseBuilder, joinClauseBuilder);

  joinClauseBuilder.toKnexQuery(knexJoinBuilder);
}

function isModel(item: nany) {
  return isObject(item) && item.$isObjectionModel;
}

function convertModel(model: nany): nany {
  return model.$toDatabaseJson();
}

function convertPlainObject(
  obj: nany,
  builder: nany,
  i: nany,
  opName: string,
  skipUndefined: boolean,
) {
  return Object.keys(obj).reduce(
    (
      out: Record<string | number | symbol, nany>,
      key: string | number | symbol,
    ) => {
      const item = obj[key];

      if (item === undefined) {
        if (!skipUndefined) {
          throw new Error(
            `undefined passed as a property in argument #${i} for '${opName}' operation. Call skipUndefined() method to ignore the undefined values.`,
          );
        }
      } else if (hasToKnexRawMethod(item)) {
        out[key] = convertToKnexRaw(item, builder);
      } else if (isObjectionQueryBuilderBase(item)) {
        out[key] = convertQueryBuilderBase(item, builder);
      } else {
        out[key] = item;
      }

      return out;
    },
    {},
  );
}
