import { InsertOperation } from './InsertOperation.ts';
import { DelegateOperation } from './DelegateOperation.ts';
import { keyByProps } from '../../model/modelUtils.ts';
import { asArray } from '../../utils/object.ts';
import { nany } from '../../ninja.ts';
import { HasOnAfter2 } from './QueryBuilderOperation.ts';

export class InsertAndFetchOperation extends DelegateOperation
  implements HasOnAfter2 {
  constructor(name: string, opt: nany) {
    super(name, opt);

    if (!this.delegate.is(InsertOperation)) {
      throw new Error('Invalid delegate');
    }
  }

  get models() {
    return (this.delegate as InsertOperation).models;
  }

  override async onAfter2(builder: nany, inserted: nany) {
    const modelClass = builder.modelClass();
    const insertedModels = await super.onAfter2(builder, inserted);

    const insertedModelArray = asArray(insertedModels);
    const idProps = modelClass.getIdPropertyArray();
    const ids = insertedModelArray.map((model) => model.$id());

    const fetchedModels = await modelClass
      .query()
      .childQueryOf(builder)
      .findByIds(ids)
      .castTo(builder.resultModelClass());

    const modelsById = keyByProps(fetchedModels, idProps);

    // Instead of returning the freshly fetched models, update the input
    // models with the fresh values.
    insertedModelArray.forEach((insertedModel) => {
      insertedModel.$set(modelsById.get(insertedModel.$propKey(idProps)));
    });

    return insertedModels;
  }
}
