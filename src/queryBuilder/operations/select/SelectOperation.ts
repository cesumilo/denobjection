import { flatten } from '../../../utils/object.ts';
import { Selection } from './Selection.ts';
import {
  ObjectionToKnexConvertingOperation,
} from '../ObjectionToKnexConvertingOperation.ts';
import { nany } from '../../../ninja.ts';
import {
  HasOnAdd,
  HasOnBuildKnex,
  QueryBuilderOperation,
} from '../QueryBuilderOperation.ts';
import { COUNT_REGEX } from '../../../constants/regexps.ts';

export class SelectOperation extends ObjectionToKnexConvertingOperation
  implements HasOnAdd, HasOnBuildKnex {
  private selections: nany[];

  constructor(name: string, opt: nany = {}) {
    super(name, opt);
    this.selections = [];
  }

  override onAdd(builder: nany, ...args: nany[]) {
    const selections = flatten(args);

    // Don't add an empty selection. Empty list is accepted for `count`, `countDistinct`
    // etc. because knex apparently supports it.
    if (selections.length === 0 && !COUNT_REGEX.test(this.name)) {
      return false;
    }

    const ret = super.onAdd(builder, selections);

    for (const selection of selections) {
      const selectionInstance = Selection.create(selection);

      if (selectionInstance) {
        this.selections.push(selectionInstance);
      }
    }

    return ret;
  }

  onBuildKnex(knexBuilder: nany, builder: nany) {
    return knexBuilder[this.name].apply(knexBuilder, this.getKnexArgs(builder));
  }

  findSelection(builder: nany, selectionToFind: nany) {
    const selectionInstanceToFind: Selection | null = Selection.create(
      selectionToFind,
    );

    if (!selectionInstanceToFind) {
      return null;
    }

    for (const selection of this.selections) {
      if (Selection.doesSelect(builder, selection, selectionInstanceToFind)) {
        return selection;
      }
    }

    return null;
  }

  override clone(): SelectOperation {
    return this.cloneInto(
      new SelectOperation(this.name, this.opt),
    ) as SelectOperation;
  }

  override cloneInto(
    clone: ObjectionToKnexConvertingOperation,
  ): QueryBuilderOperation {
    const selectClone = super.cloneInto(clone) as SelectOperation;
    selectClone.selections = this.selections.slice();
    return selectClone;
  }
}
