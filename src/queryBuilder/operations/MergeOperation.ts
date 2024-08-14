import { nany } from '../../ninja.ts';
import { isEmpty, isFunction, isObject } from '../../utils/object.ts';
import {
  HasOnAdd,
  HasOnBuildKnex,
  HasToFindOperation,
  QueryBuilderOperation,
} from './QueryBuilderOperation.ts';
import { convertFieldExpressionsToRaw } from './UpdateOperation.ts';

export class MergeOperation extends QueryBuilderOperation
  implements HasOnAdd, HasOnBuildKnex, HasToFindOperation {
  model?: nany;
  args?: nany;

  constructor(name: string, opt: nany = {}) {
    super(name, opt);
  }

  onAdd(builder: nany, ...args: nany[]) {
    this.args = args;

    if (!isEmpty(args) && isObject(args[0]) && !Array.isArray(args[0])) {
      const json = args[0];
      const modelClass = builder.modelClass();

      this.model = modelClass.ensureModel(json, { patch: true });
    }

    return true;
  }

  onBuildKnex(knexBuilder: nany, builder: nany) {
    if (!isFunction(knexBuilder.merge)) {
      throw new Error(
        'merge method can only be chained right after onConflict method',
      );
    }

    if (this.model) {
      const json = this.model.$toDatabaseJson(builder);
      const convertedJson = convertFieldExpressionsToRaw(
        builder,
        this.model,
        json,
      );

      return knexBuilder.merge(convertedJson);
    }

    return knexBuilder.merge(...this.args);
  }

  toFindOperation() {
    return null;
  }

  override clone(): MergeOperation {
    return this.cloneInto(
      new MergeOperation(this.name, this.opt),
    ) as MergeOperation;
  }

  override cloneInto(clone: QueryBuilderOperation): QueryBuilderOperation {
    super.cloneInto(clone);

    const mergeClone = clone as MergeOperation;
    mergeClone.model = this.model;
    mergeClone.args = this.args;

    return mergeClone;
  }
}
