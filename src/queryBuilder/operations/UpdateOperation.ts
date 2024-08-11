import { ref } from '../../queryBuilder/ReferenceBuilder.ts';
import { isEmpty } from '../../utils/object.ts';
import { isKnexQueryBuilder, isKnexRaw } from '../../utils/knex.ts';
import {
  HasOnAdd,
  HasOnAfter2,
  HasOnBefore2,
  HasOnBefore3,
  HasOnBuildKnex,
  HasToFindOperation,
  QueryBuilderOperation,
} from './QueryBuilderOperation.ts';
import { StaticHookArguments } from '../StaticHookArguments.ts';
import { nany } from '../../ninja.ts';
import { ParsedExpression } from '../../utils/parseFieldExpression.ts';

export class UpdateOperation extends QueryBuilderOperation
  implements
    HasOnAdd,
    HasOnBefore2,
    HasOnBefore3,
    HasOnBuildKnex,
    HasOnAfter2,
    HasToFindOperation {
  protected model: nany;
  protected modelOptions: nany;

  constructor(name: string, opt: nany) {
    super(name, opt);

    this.model = null;
    this.modelOptions = Object.assign({}, this.opt.modelOptions || {});
  }

  onAdd(builder: nany, ...args: nany[]) {
    const json = args[0];
    const modelClass = builder.modelClass();

    this.model = modelClass.ensureModel(json, this.modelOptions);
    return true;
  }

  async onBefore2(builder: nany, result: nany) {
    await callBeforeUpdate(builder, this.model, this.modelOptions);
    return result;
  }

  onBefore3(builder: nany) {
    const row = this.model.$toDatabaseJson(builder);

    if (isEmpty(row)) {
      // Resolve the query if there is nothing to update.
      builder.resolve(0);
    }
  }

  onBuildKnex(knexBuilder: nany, builder: nany) {
    const json = this.model.$toDatabaseJson(builder);
    const convertedJson = convertFieldExpressionsToRaw(
      builder,
      this.model,
      json,
    );

    return knexBuilder.update(convertedJson);
  }

  onAfter2(builder: nany, numUpdated: nany) {
    return callAfterUpdate(builder, this.model, this.modelOptions, numUpdated);
  }

  toFindOperation() {
    return null;
  }

  override clone(): UpdateOperation {
    return this.cloneInto(
      new UpdateOperation(this.name, this.opt),
    ) as UpdateOperation;
  }

  override cloneInto(clone: QueryBuilderOperation): QueryBuilderOperation {
    super.cloneInto(clone);
    const updateOperation = clone as UpdateOperation;
    updateOperation.model = this.model;
    return updateOperation;
  }
}

async function callBeforeUpdate(
  builder: nany,
  model: nany,
  modelOptions: nany,
) {
  await callInstanceBeforeUpdate(builder, model, modelOptions);
  return callStaticBeforeUpdate(builder);
}

function callInstanceBeforeUpdate(
  builder: nany,
  model: nany,
  modelOptions: nany,
) {
  return model.$beforeUpdate(modelOptions, builder.context());
}

function callStaticBeforeUpdate(builder: nany) {
  const args = StaticHookArguments.create({ builder });
  return builder.modelClass().beforeUpdate(args);
}

async function callAfterUpdate(
  builder: nany,
  model: nany,
  modelOptions: nany,
  result: nany,
) {
  await callInstanceAfterUpdate(builder, model, modelOptions);
  return callStaticAfterUpdate(builder, result);
}

function callInstanceAfterUpdate(
  builder: nany,
  model: nany,
  modelOptions: nany,
) {
  return model.$afterUpdate(modelOptions, builder.context());
}

async function callStaticAfterUpdate(builder: nany, result: nany) {
  const args = StaticHookArguments.create({ builder, result });
  const maybeResult = await builder.modelClass().afterUpdate(args);

  if (maybeResult === undefined) {
    return result;
  } else {
    return maybeResult;
  }
}

export function convertFieldExpressionsToRaw(
  builder: nany,
  model: nany,
  json: nany,
) {
  const knex = builder.knex();
  const convertedJson: Record<string, nany> = {};

  for (const key of Object.keys(json)) {
    let val = json[key];

    if (key.indexOf(':') > -1) {
      // 'col:attr' : ref('other:lol') is transformed to
      // "col" : raw(`jsonb_set("col", '{attr}', to_jsonb("other"#>'{lol}'), true)`)

      const parsed = ref(key);
      // TODO how to handle if parsedExpr is null?
      const jsonRefs = '{' +
        (parsed.parsedExpr as ParsedExpression).access.map((it) => it.ref).join(
          ',',
        ) + '}';
      let valuePlaceholder = '?';

      if (isKnexQueryBuilder(val) || isKnexRaw(val)) {
        valuePlaceholder = 'to_jsonb(?)';
      } else {
        val = JSON.stringify(val);
      }

      // TODO how to handle if column is null?

      convertedJson[parsed.column as string] = knex.raw(
        `jsonb_set(??, '${jsonRefs}', ${valuePlaceholder}, true)`,
        [convertedJson[parsed.column as string] || parsed.column, val],
      );

      delete model[key];
    } else {
      convertedJson[key] = val;
    }
  }

  return convertedJson;
}
