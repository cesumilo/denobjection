import { HasOnAdd, QueryBuilderOperation } from './QueryBuilderOperation.ts';
import { assertIdNotUndefined } from '../../utils/assert.ts';
import { nany } from '../../ninja.ts';
import { QueryBuilderOperationSupport } from '../QueryBuilderOperationSupport.ts';

export class FindByIdOperation extends QueryBuilderOperation
  implements HasOnAdd {
  id: nany;

  constructor(name: string, opt: nany) {
    super(name, opt);
    this.id = this.opt.id;
  }

  onAdd(_: QueryBuilderOperationSupport<nany>, ...args: nany[]) {
    if (this.id === null || this.id === undefined) {
      this.id = args[0];
    }
    return true;
  }

  onBuild(builder: nany) {
    if (!builder.internalOptions().skipUndefined) {
      assertIdNotUndefined(this.id, `undefined was passed to ${this.name}`);
    }

    builder.whereComposite(builder.fullIdColumn(), this.id);
  }

  override clone() {
    const clone = new FindByIdOperation(this.name, this.opt);
    super.cloneInto(clone);
    clone.id = this.id;
    return clone;
  }
}
