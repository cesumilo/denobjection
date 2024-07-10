import { Knex } from 'knex';
import { nany } from '../../ninja.ts';
import {
  HasAllHooks,
  HasOnAdd,
  HasOnAfter1,
  HasOnAfter2,
  HasOnAfter3,
  HasOnBefore1,
  HasOnBefore2,
  HasOnBefore3,
  HasOnBuild,
  HasOnBuildKnex,
  HasOnError,
  HasOnRawResult,
  HasQueryExecutor,
  HasToFindOperation,
  QueryBuilderOperation,
} from './QueryBuilderOperation.ts';

// Operation that simply delegates all calls to the operation passed
// to to the constructor in `opt.delegate`.
export class DelegateOperation extends QueryBuilderOperation
  implements HasAllHooks {
  delegate: QueryBuilderOperation;

  constructor(
    name: string | undefined,
    opt: { delegate: QueryBuilderOperation },
  ) {
    super(name, opt);

    this.delegate = opt.delegate;
  }

  override is<T extends QueryBuilderOperation>(
    OperationClass: Function,
  ): this is T {
    return super.is(OperationClass) || this.delegate.is(OperationClass);
  }

  override hasHook(hookName: keyof HasAllHooks): boolean {
    return this[hookName] !== DelegateOperation.prototype[hookName] ||
      this.delegate.hasHook(hookName);
  }

  onAdd(builder: nany, ...args: nany[]): nany {
    return (this.delegate as QueryBuilderOperation & HasOnAdd).onAdd(
      builder,
      args,
    );
  }

  onBefore1(builder: nany, result: nany) {
    return (this.delegate as QueryBuilderOperation & HasOnBefore1).onBefore1(
      builder,
      result,
    );
  }

  onBefore2(builder: nany, result: nany) {
    return (this.delegate as QueryBuilderOperation & HasOnBefore2).onBefore2(
      builder,
      result,
    );
  }

  onBefore3(builder: nany, result: nany) {
    return (this.delegate as QueryBuilderOperation & HasOnBefore3).onBefore3(
      builder,
      result,
    );
  }

  onBuild(builder: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasOnBuild).onBuild(
      builder,
    );
  }

  onBuildKnex(knexBuilder: Knex.QueryBuilder, builder: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasOnBuildKnex)
      .onBuildKnex(knexBuilder, builder);
  }

  onRawResult(builder: nany, result: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasOnRawResult)
      .onRawResult(builder, result);
  }

  onAfter1(builder: nany, result: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasOnAfter1).onAfter1(
      builder,
      result,
    );
  }

  onAfter2(builder: nany, result: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasOnAfter2).onAfter2(
      builder,
      result,
    );
  }

  onAfter3(builder: nany, result: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasOnAfter3).onAfter3(
      builder,
      result,
    );
  }

  queryExecutor(builder: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasQueryExecutor)
      .queryExecutor(builder);
  }

  onError(builder: nany, error: Error): nany {
    return (this.delegate as QueryBuilderOperation & HasOnError).onError(
      builder,
      error,
    );
  }

  toFindOperation(builder: nany): nany {
    return (this.delegate as QueryBuilderOperation & HasToFindOperation)
      .toFindOperation(builder);
  }

  override clone() {
    const clone = new DelegateOperation(this.name, { delegate: this.delegate });
    return this.cloneInto(clone);
  }

  override cloneInto(clone: DelegateOperation): DelegateOperation {
    super.cloneInto(clone);
    clone.delegate = this.delegate && this.delegate.clone();
    return clone;
  }
}
