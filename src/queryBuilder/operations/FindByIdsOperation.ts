import { nany } from '../../ninja.ts';
import { QueryBuilderOperationSupport } from '../QueryBuilderOperationSupport.ts';
import {
  HasOnAdd,
  HasOnBuild,
  QueryBuilderOperation,
} from './QueryBuilderOperation.ts';

export class FindByIdsOperation extends QueryBuilderOperation
  implements HasOnAdd, HasOnBuild {
  private ids: nany;

  constructor(name: string, opt: nany) {
    super(name, opt);
    this.ids = null;
  }

  onAdd(_: QueryBuilderOperationSupport<nany>, ...args: nany[]): boolean {
    this.ids = args[0];
    return true;
  }

  onBuild(builder: nany) {
    builder.whereInComposite(builder.fullIdColumn(), this.ids);
  }

  override clone() {
    const clone = new FindByIdsOperation(this.name, this.opt);
    super.cloneInto(clone);
    clone.ids = this.ids;
    return clone;
  }
}
