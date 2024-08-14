import {
  isFunction,
  isRegExp,
  isString,
  last,
  mergeMaps,
} from '../utils/object.ts';
import { QueryBuilderContextBase } from './QueryBuilderContextBase.ts';
import { QueryBuilderUserContext } from './QueryBuilderUserContext.ts';
import { deprecate } from '../utils/deprecate.ts';
import { nany } from '../ninja.ts';
import { InternalOptions } from './InternalOptions.ts';
import { Knex } from 'knex';
import {
  HasAllHooks,
  HasToFindOperation,
  QueryBuilderOperation,
} from './operations/QueryBuilderOperation.ts';
import { Class } from '../types/Class.ts';

const AllSelector: OperationSelector = () => true;
const SelectSelector: OperationSelector =
  /^(select|columns|column|distinct|count|countDistinct|min|max|sum|sumDistinct|avg|avgDistinct)$/;
const WhereSelector: OperationSelector = /^(where|orWhere|andWhere|find\w+)/;
const OnSelector: OperationSelector = /^(on|orOn|andOn)/;
const OrderBySelector: OperationSelector = /orderBy/;
const JoinSelector: OperationSelector = /(join|joinRaw|joinRelated)$/i;
const FromSelector: OperationSelector = /^(from|into|table)$/;

export interface IModel {
  knex(): Knex | undefined;
}

export type OperationSelector =
  | boolean
  | string
  | RegExp
  | Class<QueryBuilderOperation>
  | ((op: QueryBuilderOperation) => boolean);

export class QueryBuilderOperationSupport<
  T extends IModel,
> {
  #modelClass: T;
  #operations: QueryBuilderOperation[];
  #parentQuery?: QueryBuilderOperationSupport<nany>;
  #isPartialQuery: boolean;
  #activeOperations: {
    operation: QueryBuilderOperation;
    hookName: keyof HasAllHooks;
  }[];

  protected _context: QueryBuilderContextBase<T>;

  constructor(modelClass: T) {
    this.#modelClass = modelClass;
    this.#operations = [];
    this._context = new QueryBuilderOperationSupport.QueryBuilderContext(this);
    this.#isPartialQuery = false;
    this.#activeOperations = [];
  }

  static forClass<T extends IModel>(modelClass: T) {
    return new this(modelClass);
  }

  static get AllSelector() {
    return AllSelector;
  }

  static get QueryBuilderContext() {
    return QueryBuilderContextBase;
  }

  static get QueryBuilderUserContext() {
    return QueryBuilderUserContext;
  }

  static get SelectSelector() {
    return SelectSelector;
  }

  static get WhereSelector() {
    return WhereSelector;
  }

  static get OnSelector() {
    return OnSelector;
  }

  static get JoinSelector() {
    return JoinSelector;
  }

  static get FromSelector() {
    return FromSelector;
  }

  static get OrderBySelector() {
    return OrderBySelector;
  }

  modelClass(): T {
    return this.#modelClass;
  }

  context(): QueryBuilderUserContext<T> | undefined;
  context(obj: QueryBuilderUserContext<T>): this;
  context(
    obj?: QueryBuilderUserContext<T>,
  ): QueryBuilderUserContext<T> | undefined | this {
    const ctx = this._context;

    if (!obj) {
      return ctx.userContext;
    } else {
      ctx.userContext = ctx.userContext?.newMerge(this, obj);
      return this;
    }
  }

  clearContext() {
    const ctx = this._context;
    ctx.userContext = new QueryBuilderOperationSupport.QueryBuilderUserContext(
      this,
    );
    return this;
  }

  internalContext(): QueryBuilderContextBase<T>;
  internalContext(ctx: QueryBuilderContextBase<T>): this;
  internalContext(
    ctx?: QueryBuilderContextBase<T>,
  ): QueryBuilderContextBase<T> | this {
    if (!ctx) {
      return this._context;
    } else {
      this._context = ctx;
      return this;
    }
  }

  internalOptions(): InternalOptions | undefined;
  internalOptions(opt: InternalOptions): this;
  internalOptions(
    opt?: InternalOptions,
  ): InternalOptions | undefined | this {
    if (!opt) {
      return this._context.options;
    } else {
      const oldOpt = this._context.options;
      this._context.options = Object.assign(oldOpt ?? {}, opt);
      return this;
    }
  }

  isPartial(): boolean;
  isPartial(isPartial: boolean): this;
  isPartial(isPartial?: boolean): boolean | this {
    if (isPartial === undefined) {
      return this.#isPartialQuery;
    } else {
      this.#isPartialQuery = isPartial;
      return this;
    }
  }

  isInternal(): boolean | undefined {
    return this.internalOptions()?.isInternalQuery;
  }

  tableNameFor(tableName: string): string;
  tableNameFor(tableName: string, newTableName: string): this;
  tableNameFor(tableName: string, newTableName?: string): string | this {
    const ctx = this.internalContext();
    const tableMap = ctx.tableMap;

    if (isString(newTableName)) {
      ctx.tableMap = tableMap || new Map();
      ctx.tableMap.set(tableName, newTableName);
      return this;
    } else {
      return (tableMap && tableMap.get(tableName)) || tableName;
    }
  }

  aliasFor(tableName: string): string | undefined;
  aliasFor(tableName: string, alias: string): QueryBuilderOperationSupport<T>;
  aliasFor(
    tableName: string,
    alias?: string,
  ): string | QueryBuilderOperationSupport<T> | undefined {
    const ctx = this.internalContext();
    const aliasMap = ctx.aliasMap;

    if (isString(alias)) {
      ctx.aliasMap = aliasMap || new Map();
      ctx.aliasMap.set(tableName, alias);
      return this;
    } else {
      return (aliasMap && aliasMap.get(tableName)) || undefined;
    }
  }

  tableRefFor(tableName: string): string {
    return this.aliasFor(tableName) || this.tableNameFor(tableName);
  }

  /**
   * Sets the current query as a child query of the provided query.
   *
   * @param query - The parent query to set as the current query's parent.
   * @param options - Optional parameters for configuring the child query.
   * @param options.fork - If true, creates a fork of the parent query's internal context.
   * @param options.isInternalQuery - If true, marks the child query as an internal query.
   * @returns The current QueryBuilderOperationSupport instance.
   */
  childQueryOf(
    query?: QueryBuilderOperationSupport<T>,
    { fork, isInternalQuery }: { fork?: boolean; isInternalQuery?: boolean } =
      {},
  ): this {
    if (query) {
      const currentCtx = this.context();
      let ctx = query.internalContext();

      if (fork) {
        const newCtx = ctx.clone();
        ctx = newCtx;
      }

      if (isInternalQuery && ctx.options) {
        ctx.options.isInternalQuery = true;
      }

      this.#parentQuery = query;
      this.internalContext(ctx);
      if (currentCtx) {
        this.context(currentCtx); // TODO: Why is this needed?
      }

      // Use the parent's knex if there was no knex in `ctx`.
      if (!this.unsafeKnex() && query.unsafeKnex()) {
        this.knex(query.unsafeKnex() as Knex);
      }
    }

    return this;
  }

  /**
   * Sets the current query as a subquery of the provided query.
   *
   * @param query - The query to set as the parent query.
   * @returns The current instance of the QueryBuilderOperationSupport class.
   */
  subqueryOf(query: QueryBuilderOperationSupport<T>): this {
    if (query) {
      if (this.#isPartialQuery) {
        // Merge alias and table name maps for "partial" subqueries.
        const ctx = this.internalContext();
        const queryCtx = query.internalContext();

        if (queryCtx.aliasMap) {
          ctx.aliasMap = ctx.aliasMap
            ? mergeMaps(
              queryCtx.aliasMap,
              ctx.aliasMap,
            )
            : queryCtx.aliasMap;
        }
        if (queryCtx.tableMap) {
          ctx.tableMap = ctx.tableMap
            ? mergeMaps(
              queryCtx.tableMap,
              ctx.tableMap,
            )
            : queryCtx.tableMap;
        }
      }

      this.#parentQuery = query;

      if (!this.unsafeKnex() && query.unsafeKnex()) {
        this.knex(query.unsafeKnex() as Knex);
      }
    }

    return this;
  }

  parentQuery(): QueryBuilderOperationSupport<T> | undefined {
    return this.#parentQuery;
  }

  knex(): Knex;
  knex(instance: Knex): this;
  knex(instance?: Knex): Knex | this {
    if (!instance) {
      const knex = this.unsafeKnex();

      if (!knex) {
        throw new Error(
          `no database connection available for a query. You need to bind the model class or the query to a knex instance.`,
        );
      }

      return knex;
    } else {
      this._context.knex = instance;
      return this;
    }
  }

  unsafeKnex(): Knex | undefined {
    return this._context.knex || this.#modelClass.knex() || undefined;
  }

  clear(operationSelector: OperationSelector): this {
    const operationsToRemove = new Set<QueryBuilderOperation>();

    this.forEachOperation(operationSelector, (op: QueryBuilderOperation) => {
      // If an ancestor operation has already been removed,
      // there's no need to remove the children anymore.
      if (!op.isAncestorInSet(operationsToRemove)) {
        operationsToRemove.add(op);
      }
    });

    for (const op of operationsToRemove) {
      this.removeOperation(op);
    }

    return this;
  }

  toFindQuery(): QueryBuilderOperationSupport<T> {
    const findQuery = this.clone();
    const operationsToReplace: {
      op: QueryBuilderOperation;
      findOp: QueryBuilderOperation;
    }[] = [];
    const operationsToRemove: QueryBuilderOperation[] = [];

    findQuery.forEachOperation(
      (op: QueryBuilderOperation) => op.hasHook('toFindOperation'),
      (op: QueryBuilderOperation) => {
        const findOp = (op as QueryBuilderOperation & HasToFindOperation)
          .toFindOperation(findQuery);

        if (!findOp) {
          operationsToRemove.push(op);
        } else {
          operationsToReplace.push({ op, findOp });
        }
      },
    );

    for (const op of operationsToRemove) {
      findQuery.removeOperation(op);
    }

    for (const { op, findOp } of operationsToReplace) {
      findQuery.replaceOperation(op, findOp);
    }

    return findQuery;
  }

  clearSelect(): this {
    return this.clear(SelectSelector);
  }

  clearWhere(): this {
    return this.clear(WhereSelector);
  }

  clearOrder(): this {
    return this.clear(OrderBySelector);
  }

  copyFrom(
    queryBuilder: QueryBuilderOperationSupport<nany>,
    operationSelector: OperationSelector,
  ): this {
    const operationsToAdd = new Set<QueryBuilderOperation>();

    queryBuilder.forEachOperation(
      operationSelector,
      (op: QueryBuilderOperation) => {
        // If an ancestor operation has already been added,
        // there is no need to add
        if (!op.isAncestorInSet(operationsToAdd)) {
          operationsToAdd.add(op);
        }
      },
    );

    for (const op of operationsToAdd) {
      const opClone = op.clone();

      // We may be moving nested operations to the root. Clear
      // any links to the parent operations.
      opClone.parentOperation = undefined;
      opClone.adderHookName = undefined;

      // We don't use `addOperation` here because we don't what to
      // call `onAdd` or add these operations as child operations.
      this.#operations.push(opClone);
    }

    return this;
  }

  has(operationSelector: OperationSelector) {
    return !!this.findOperation(operationSelector);
  }

  forEachOperation(
    operationSelector: OperationSelector,
    callback: (op: QueryBuilderOperation) => boolean | void,
    match: boolean = true,
  ): boolean | this {
    const selector = buildFunctionForOperationSelector(operationSelector);

    for (const op of this.#operations) {
      if (selector(op) === match && callback(op) === false) {
        break;
      }

      const childRes = op.forEachDescendantOperation(
        (op: QueryBuilderOperation) => {
          if (selector(op) === match && callback(op) === false) {
            return false;
          }
        },
      );

      if (childRes === false) {
        break;
      }
    }

    return this;
  }

  findOperation(
    operationSelector: OperationSelector,
  ): QueryBuilderOperation | null {
    let op = null;

    this.forEachOperation(operationSelector, (it) => {
      op = it;
      return false;
    });

    return op;
  }

  findLastOperation(
    operationSelector: OperationSelector,
  ): QueryBuilderOperation | null {
    let op = null;

    this.forEachOperation(operationSelector, (it) => {
      op = it;
    });

    return op;
  }

  everyOperation(operationSelector: OperationSelector): boolean {
    let every = true;

    this.forEachOperation(
      operationSelector,
      () => {
        every = false;
        return false;
      },
      false,
    );

    return every;
  }

  callOperationMethod(
    operation: QueryBuilderOperation,
    hookName: keyof HasAllHooks,
    ...args: nany[]
  ) {
    try {
      operation.removeChildOperationsByHookName(hookName);

      this.#activeOperations.push({
        operation,
        hookName,
      });

      // deno-lint-ignore no-explicit-any
      return (operation as any)[hookName](...args);
    } finally {
      this.#activeOperations.pop();
    }
  }

  async callAsyncOperationMethod(
    operation: QueryBuilderOperation,
    hookName: keyof HasAllHooks,
    ...args: nany[]
  ) {
    operation.removeChildOperationsByHookName(hookName);

    this.#activeOperations.push({
      operation,
      hookName,
    });

    try {
      // deno-lint-ignore no-explicit-any
      return await (operation as any)[hookName](...args);
    } finally {
      this.#activeOperations.pop();
    }
  }

  addOperation(operation: QueryBuilderOperation, ...args: nany[]) {
    const ret = this.addOperationUsingMethod('push', operation, args);
    return ret;
  }

  addOperationToFront(operation: QueryBuilderOperation, ...args: nany[]) {
    return this.addOperationUsingMethod('unshift', operation, args);
  }

  addOperationUsingMethod(
    arrayMethod: keyof Array<QueryBuilderOperation>,
    operation: QueryBuilderOperation,
    ...args: nany[]
  ): this {
    const shouldAdd = this.callOperationMethod(operation, 'onAdd', [
      this,
      args,
    ]);

    if (shouldAdd) {
      if (this.#activeOperations.length) {
        const { operation: parentOperation, hookName } = last(
          this.#activeOperations,
        );
        parentOperation.addChildOperation(hookName, operation);
      } else {
        // deno-lint-ignore no-explicit-any
        (this.#operations as any)[arrayMethod](operation);
      }
    }

    return this;
  }

  removeOperation(operation: QueryBuilderOperation) {
    if (operation.parentOperation) {
      operation.parentOperation.removeChildOperation(operation);
    } else {
      const index = this.#operations.indexOf(operation);

      if (index !== -1) {
        this.#operations.splice(index, 1);
      }
    }

    return this;
  }

  replaceOperation(
    operation: QueryBuilderOperation,
    newOperation: QueryBuilderOperation,
  ) {
    if (operation.parentOperation) {
      operation.parentOperation.replaceChildOperation(operation, newOperation);
    } else {
      const index = this.#operations.indexOf(operation);

      if (index !== -1) {
        this.#operations[index] = newOperation;
      }
    }

    return this;
  }

  clone() {
    return this.baseCloneInto(
      new QueryBuilderOperationSupport(this.#modelClass),
    );
  }

  baseCloneInto(builder: QueryBuilderOperationSupport<T>) {
    builder.#modelClass = this.#modelClass;
    builder.#operations = this.#operations.map((it) => it.clone());
    builder._context = this._context.clone();
    builder.#parentQuery = this.#parentQuery;
    builder.#isPartialQuery = this.#isPartialQuery;

    // Don't copy the active operation stack. We never continue (nor can we)
    // a query from the exact mid-hook-call state.
    builder.#activeOperations = [];

    return builder;
  }

  toKnexQuery(knexBuilder = this.knex().queryBuilder()) {
    this.executeOnBuild();
    return this.executeOnBuildKnex(knexBuilder);
  }

  executeOnBuild() {
    this.forEachOperation(true, (op) => {
      if (op.hasHook('onBuild')) {
        this.callOperationMethod(op, 'onBuild', [this]);
      }
    });
  }

  executeOnBuildKnex(knexBuilder: Knex.QueryBuilder) {
    this.forEachOperation(true, (op) => {
      if (op.hasHook('onBuildKnex')) {
        const newKnexBuilder = this.callOperationMethod(op, 'onBuildKnex', [
          knexBuilder,
          this,
        ]);
        // Default to the input knex builder for backwards compatibility
        // with QueryBuilder.onBuildKnex hooks.
        knexBuilder = newKnexBuilder || knexBuilder;
      }
    });

    return knexBuilder;
  }

  toString() {
    return this.toKnexQuery().toString();
  }

  toSql() {
    return this.toString();
  }

  /**
   * @deprecated skipUndefined() is deprecated and will be removed in objection 4.0
   */
  @deprecate('It will be removed in objection 4.0')
  skipUndefined(): this {
    const internalOptions = this.internalOptions();
    if (internalOptions) {
      internalOptions.skipUndefined = true;
    }
    return this;
  }
}

function buildFunctionForOperationSelector(
  operationSelector: OperationSelector,
): (op: QueryBuilderOperation) => boolean {
  if (operationSelector === true) {
    return AllSelector as (op: QueryBuilderOperation) => boolean;
  } else if (isRegExp(operationSelector)) {
    return (op: QueryBuilderOperation) => operationSelector.test(op.name ?? '');
  } else if (isString(operationSelector)) {
    return (op: QueryBuilderOperation) => op.name === operationSelector;
  } else if (
    isFunction(operationSelector) &&
    'isQueryBuilderOperation' in operationSelector
  ) {
    return (op: QueryBuilderOperation) =>
      // deno-lint-ignore no-explicit-any
      op.is(operationSelector as Class<any>);
  } else if (isFunction(operationSelector)) {
    return operationSelector as (op: QueryBuilderOperation) => boolean;
  } else {
    return () => false;
  }
}
