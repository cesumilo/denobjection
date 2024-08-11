import { nany } from '../../ninja.ts';

export class QueryTransformation {
  onConvertQueryBuilderBase(item: nany, builder: nany): nany {
    return item;
  }
}
