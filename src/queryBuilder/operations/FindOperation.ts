import {
  HasOnAfter3,
  HasOnBefore2,
  QueryBuilderOperation,
} from './QueryBuilderOperation.ts';
import { StaticHookArguments } from '../StaticHookArguments.ts';
import {
  after,
  afterReturn,
  isPromise,
} from '../../utils/promiseUtils/index.ts';
import { isObject } from '../../utils/object.ts';
import { nany } from '../../ninja.ts';

export class FindOperation extends QueryBuilderOperation
  implements HasOnBefore2, HasOnAfter3 {
  onBefore2(builder: nany, result: nany) {
    return afterReturn(callStaticBeforeFind(builder), result);
  }

  onAfter3(builder: nany, results: nany) {
    const opt = builder.findOptions();

    if (opt.dontCallFindHooks) {
      return results;
    } else {
      return callAfterFind(builder, results);
    }
  }
}

function callStaticBeforeFind(builder: nany) {
  const args = StaticHookArguments.create({ builder });
  return builder.modelClass().beforeFind(args);
}

function callAfterFind(builder: nany, result: nany) {
  const opt = builder.findOptions();
  const maybePromise = callInstanceAfterFind(
    builder.context(),
    result,
    opt.callAfterFindDeeply,
  );

  return after(maybePromise, () => callStaticAfterFind(builder, result));
}

function callStaticAfterFind(builder: nany, result: nany) {
  const args = StaticHookArguments.create({ builder, result });
  const maybePromise = builder.modelClass().afterFind(args);

  return after(maybePromise, (maybeResult) => {
    if (maybeResult === undefined) {
      return result;
    } else {
      return maybeResult;
    }
  });
}

function callInstanceAfterFind(ctx: nany, results: nany, deep: nany) {
  if (Array.isArray(results)) {
    if (results.length === 1) {
      return callAfterFindForOne(ctx, results[0], results, deep);
    } else {
      return callAfterFindArray(ctx, results, deep);
    }
  } else {
    return callAfterFindForOne(ctx, results, results, deep);
  }
}

function callAfterFindArray(ctx: nany, results: nany, deep: nany) {
  if (results.length === 0 || !isObject(results[0])) {
    return results;
  }

  const mapped = new Array(results.length);
  let containsPromise = false;

  for (let i = 0, l = results.length; i < l; ++i) {
    mapped[i] = callAfterFindForOne(ctx, results[i], results[i], deep);

    if (isPromise(mapped[i])) {
      containsPromise = true;
    }
  }

  if (containsPromise) {
    return Promise.all(mapped);
  } else {
    return mapped;
  }
}

function callAfterFindForOne(ctx: nany, model: nany, result: nany, deep: nany) {
  if (!isObject(model) || !model.$isObjectionModel) {
    return result;
  }

  if (deep) {
    const results: nany = [];
    const containsPromise = callAfterFindForRelations(ctx, model, results);

    if (containsPromise) {
      return Promise.all(results).then(() => {
        return doCallAfterFind(ctx, model, result);
      });
    } else {
      return doCallAfterFind(ctx, model, result);
    }
  } else {
    return doCallAfterFind(ctx, model, result);
  }
}

function callAfterFindForRelations(ctx: nany, model: nany, results: nany) {
  const keys = Object.keys(model);
  let containsPromise = false;

  for (let i = 0, l = keys.length; i < l; ++i) {
    const key = keys[i];
    const value = model[key];

    if (isRelation(value)) {
      const maybePromise = callInstanceAfterFind(ctx, value, true);

      if (isPromise(maybePromise)) {
        containsPromise = true;
      }

      results.push(maybePromise);
    }
  }

  return containsPromise;
}

function isRelation(value: nany) {
  return (
    (isObject(value) && value.$isObjectionModel) ||
    (isNonEmptyObjectArray(value) && value[0].$isObjectionModel)
  );
}

function isNonEmptyObjectArray(value: nany) {
  return Array.isArray(value) && value.length > 0 && isObject(value[0]);
}

function doCallAfterFind(ctx: nany, model: nany, result: nany) {
  const afterFind = getAfterFindHook(model);

  if (afterFind !== null) {
    const maybePromise = afterFind.call(model, ctx);

    if (isPromise(maybePromise)) {
      return maybePromise.then(() => result);
    } else {
      return result;
    }
  } else {
    return result;
  }
}

function getAfterFindHook(model: nany) {
  if (model.$afterFind !== model.$objectionModelClass.prototype.$afterFind) {
    return model.$afterFind;
  } else {
    return null;
  }
}
