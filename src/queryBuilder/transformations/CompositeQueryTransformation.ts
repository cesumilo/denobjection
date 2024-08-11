import { nany } from '../../ninja.ts';
import { QueryTransformation } from './QueryTransformation.ts';

export class CompositeQueryTransformation extends QueryTransformation {
  private transformations: QueryTransformation[];

  constructor(transformations: QueryTransformation[]) {
    super();
    this.transformations = transformations;
  }

  override onConvertQueryBuilderBase(item: nany, builder: nany) {
    for (const transformation of this.transformations) {
      item = transformation.onConvertQueryBuilderBase(item, builder);
    }

    return item;
  }
}
