import { nany } from '../../ninja.ts';
import { QueryBuilderOperationSupport } from '../QueryBuilderOperationSupport.ts';
import { knex } from 'knex';

export interface HasOnAdd {
  // This is called immediately when a query builder method is called.
  //
  // This method must be synchronous.
  // This method should never call any methods that add operations to the builder.
  onAdd(
    builder: QueryBuilderOperationSupport<nany>,
    ...args: nany[]
  ): boolean;
}

export interface HasOnBefore1 {
  // This is called as the first thing when the query is executed but before
  // the actual database operation (knex query) is executed.
  //
  // This method can be asynchronous.
  // You may call methods that add operations to to the builder.
  onBefore1(
    builder: QueryBuilderOperationSupport<nany>,
    result: unknown,
  ): unknown;
}

export interface HasOnBefore2 {
  // This is called as the second thing when the query is executed but before
  // the actual database operation (knex query) is executed.
  //
  // This method can be asynchronous.
  // You may call methods that add operations to to the builder.
  onBefore2(
    builder: QueryBuilderOperationSupport<nany>,
    result: unknown,
  ): unknown;
}

export interface HasOnBefore3 {
  // This is called as the third thing when the query is executed but before
  // the actual database operation (knex query) is executed.
  //
  // This method can be asynchronous.
  // You may call methods that add operations to to the builder.
  onBefore3(
    builder: QueryBuilderOperationSupport<nany>,
    result: unknown,
  ): unknown;
}

export interface HasOnBuild {
  // This is called as the last thing when the query is executed but before
  // the actual database operation (knex query) is executed. If your operation
  // needs to call other query building operations (methods that add QueryBuilderOperations)
  // this is the best and last place to do it.
  //
  // This method must be synchronous.
  // You may call methods that add operations to to the builder.
  onBuild(builder: QueryBuilderOperationSupport<nany>): void;
}

export interface HasOnBuildKnex {
  // This is called when the knex query is built. Here you should only call knex
  // methods. You may call getters and other immutable methods of the `builder`
  // but you should never call methods that add QueryBuilderOperations.
  //
  // This method must be synchronous.
  // This method should never call any methods that add operations to the builder.
  // This method should always return the knex query builder.
  onBuildKnex(
    knexBuilder: knex.QueryBuilder,
    builder: QueryBuilderOperationSupport<nany>,
  ): knex.QueryBuilder;
}

export interface HasOnRawResult {
  // The raw knex result is passed to this method right after the database query
  // has finished. This method may modify it and return the modified rows. The
  // rows are automatically converted to models (if possible) after this hook
  // is called.
  //
  // This method can be asynchronous.
  onRawResult(
    builder: QueryBuilderOperationSupport<nany>,
    rows: unknown[],
  ): unknown[];
}

export interface HasOnAfter1 {
  // This is called as the first thing after the query has been executed and
  // rows have been converted to model instances.
  //
  // This method can be asynchronous.
  onAfter1(
    builder: QueryBuilderOperationSupport<nany>,
    result: unknown,
  ): unknown;
}

export interface HasOnAfter2 {
  // This is called as the second thing after the query has been executed and
  // rows have been converted to model instances.
  //
  // This method can be asynchronous.
  onAfter2(
    builder: QueryBuilderOperationSupport<nany>,
    result: unknown,
  ): unknown;
}

export interface HasOnAfter3 {
  // This is called as the third thing after the query has been executed and
  // rows have been converted to model instances.
  //
  // This method can be asynchronous.
  onAfter3(
    builder: QueryBuilderOperationSupport<nany>,
    result: unknown,
  ): unknown;
}

export interface HasQueryExecutor {
  // This is called to execute the query and return the result.
  //
  // This method can be asynchronous.
  // You should call the appropriate method on the `builder` to execute the query.
  queryExecutor(builder: QueryBuilderOperationSupport<nany>): Promise<unknown>;
}

export interface HasOnError {
  // This is called if an error occurs in the query execution.
  //
  // This method must return a QueryBuilder instance.
  onError(builder: QueryBuilderOperationSupport<nany>, error: Error): void;
}

export interface HasToFindOperation {
  // Returns the "find" equivalent of this operation.
  //
  // For example an operation that finds an item and updates it
  // should return an operation that simply finds the item but
  // doesn't update anything. An insert operation should return
  // null since there is no find equivalent for it etc.
  toFindOperation(
    builder: QueryBuilderOperationSupport<nany>,
  ): QueryBuilderOperation | null;
}

export type HasAllHooks =
  & HasOnAdd
  & HasOnBefore1
  & HasOnBefore2
  & HasOnBefore3
  & HasOnBuild
  & HasOnBuildKnex
  & HasOnRawResult
  & HasOnAfter1
  & HasOnAfter2
  & HasOnAfter3
  & HasQueryExecutor
  & HasOnError
  & HasToFindOperation;

export type HasOneOfHooks =
  | HasOnAdd
  | HasOnBefore1
  | HasOnBefore2
  | HasOnBefore3
  | HasOnBuild
  | HasOnBuildKnex
  | HasOnRawResult
  | HasOnAfter1
  | HasOnAfter2
  | HasOnAfter3
  | HasQueryExecutor
  | HasOnError
  | HasToFindOperation;

// An abstract base class for all query builder operations. QueryBuilderOperations almost always
// correspond to a single query builder method call. For example SelectOperation could be added when
// a `select` method is called.
//
// QueryBuilderOperation is just a bunch of query execution lifecycle hooks that subclasses
// can (but don't have to) implement.
//
// Basically a query builder is nothing but an array of QueryBuilderOperations. When the query is
// executed the hooks are called in the order explained below. The hooks are called so that a
// certain hook is called for _all_ operations before the next hook is called. For example if
// a builder has 5 operations, onBefore1 hook is called for each of them (and their results are awaited)
// before onBefore2 hook is called for any of the operations.
export class QueryBuilderOperation {
  name?: string;
  opt: nany;
  // From which hook was this operation added as a child operation.
  adderHookName?: keyof HasAllHooks;
  // The parent operation that added this operation.
  parentOperation?: QueryBuilderOperation;
  // Operations this operation added in any of its hooks.
  childOperations: QueryBuilderOperation[];

  constructor(name: undefined | string = undefined, opt = {}) {
    this.name = name;
    this.opt = opt;
    this.childOperations = [];
  }

  is<T extends QueryBuilderOperation>(opClass: Function): this is T {
    return this instanceof opClass;
  }

  hasHook(hookName: keyof HasAllHooks): boolean {
    return hookName in this;
  }

  // Given a set of operations, returns true if any of this operation's
  // ancestor operations are included in the set.
  isAncestorInSet(operationSet: Set<QueryBuilderOperation>): boolean {
    let ancestor = this.parentOperation;

    while (ancestor) {
      if (operationSet.has(ancestor)) {
        return true;
      }
      ancestor = ancestor.parentOperation;
    }

    return false;
  }

  // Takes a deep clone of this operation.
  clone(): QueryBuilderOperation {
    const clone = new QueryBuilderOperation(this.name, this.opt);

    clone.adderHookName = this.adderHookName;
    clone.parentOperation = this.parentOperation;

    clone.childOperations = this.childOperations.map((childOp) => {
      const childOpClone = childOp.clone();

      childOpClone.parentOperation = clone;
      return childOpClone;
    });

    return clone;
  }

  // Add an operation as a child operation. `hookName` must be the
  // name of the parent operation's hook that called this method.
  addChildOperation(
    hookName: keyof HasAllHooks,
    operation: QueryBuilderOperation,
  ) {
    operation.adderHookName = hookName;
    operation.parentOperation = this;

    this.childOperations.push(operation);
  }

  // Removes a single child operation.
  removeChildOperation(operation: QueryBuilderOperation) {
    const index = this.childOperations.indexOf(operation);

    if (index !== -1) {
      operation.parentOperation = undefined;
      this.childOperations.splice(index, 1);
    }
  }

  // Replaces a single child operation.
  replaceChildOperation(
    operation: QueryBuilderOperation,
    newOperation: QueryBuilderOperation,
  ) {
    const index = this.childOperations.indexOf(operation);

    if (index !== -1) {
      newOperation.adderHookName = operation.adderHookName;
      newOperation.parentOperation = this;
      operation.parentOperation = undefined;
      this.childOperations[index] = newOperation;
    }
  }

  // Removes all child operations that were added from the `hookName` hook.
  removeChildOperationsByHookName(hookName: keyof HasAllHooks) {
    this.childOperations = this.childOperations.filter((op) =>
      op.adderHookName !== hookName
    );
  }

  // Iterates through all descendant operations recursively.
  forEachDescendantOperation(
    callback: (op: QueryBuilderOperation) => boolean | void,
  ): boolean {
    for (const operation of this.childOperations) {
      if (callback(operation) === false) {
        return false;
      }

      if (operation.forEachDescendantOperation(callback) === false) {
        return false;
      }
    }

    return true;
  }
}
