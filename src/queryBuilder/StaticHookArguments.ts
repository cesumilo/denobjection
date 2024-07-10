import { nany } from '../ninja.ts';
import { asArray } from '../utils/object.ts';
import { QueryBuilderOperationSupport } from './QueryBuilderOperationSupport.ts';

const BUILDER_SYMBOL = Symbol();

export class StaticHookArguments {
  [BUILDER_SYMBOL]: nany; // TODO: nany is not a valid type
  result?: nany[];

  constructor({ builder, result }: {
    builder: nany;
    result?: nany;
  }) {
    // The builder should never be accessed through the arguments.
    // Hide it as well as possible to discourage people from
    // digging it out.
    this[BUILDER_SYMBOL] = builder;
    this.result = asArray(result);
  }

  static create(
    args: { builder: nany; result?: nany },
  ) {
    return new StaticHookArguments(args);
  }

  get asFindQuery() {
    return () => {
      return this[BUILDER_SYMBOL].toFindQuery().clearWithGraphFetched()
        .runAfter(asArray);
    };
  }

  get context() {
    return this[BUILDER_SYMBOL].context();
  }

  get transaction() {
    return this[BUILDER_SYMBOL].unsafeKnex();
  }

  get relation() {
    const op = this[BUILDER_SYMBOL].findOperation(hasRelation);

    if (op) {
      return getRelation(op);
    } else {
      return undefined;
    }
  }

  get modelOptions() {
    const op = this[BUILDER_SYMBOL].findOperation(hasModelOptions);

    if (op) {
      return getModelOptions(op);
    } else {
      return undefined;
    }
  }

  get items() {
    const op = this[BUILDER_SYMBOL].findOperation(hasItems);

    if (op) {
      return asArray(getItems(op));
    } else {
      return [];
    }
  }

  get inputItems() {
    const op = this[BUILDER_SYMBOL].findOperation(hasInputItems);

    if (op) {
      return asArray(getInputItems(op));
    } else {
      return [];
    }
  }

  get cancelQuery() {
    const args = this;

    return (cancelValue: nany) => { // TODO: nany is not a valid type
      const builder = this[BUILDER_SYMBOL];

      if (cancelValue === undefined) {
        if (builder.isInsert()) {
          cancelValue = args.inputItems;
        } else if (builder.isFind()) {
          cancelValue = [];
        } else {
          cancelValue = 0;
        }
      }

      builder.resolve(cancelValue);
    };
  }
}

function getRelation(op: nany) { // TODO: nany is not a valid type
  return op.relation;
}

function hasRelation(op: nany) {
  return !!getRelation(op);
}

function getModelOptions(op: nany) {
  return op.modelOptions;
}

function hasModelOptions(op: nany) {
  return !!getModelOptions(op);
}

function getItems(op: nany) {
  return op.instance || (op.owner && op.owner.isModels && op.owner.modelArray);
}

function hasItems(op: nany) {
  return !!getItems(op);
}

function getInputItems(op: nany) {
  return op.models || op.model;
}

function hasInputItems(op: nany) {
  return !!getInputItems(op);
}
