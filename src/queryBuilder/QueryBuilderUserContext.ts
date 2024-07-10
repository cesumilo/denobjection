import { Knex } from 'knex';
import {
	IModel,
	QueryBuilderOperationSupport,
} from './QueryBuilderOperationSupport.ts';

export class QueryBuilderUserContext<T extends IModel> {
	#builder: QueryBuilderOperationSupport<T>;

	constructor(builder: QueryBuilderOperationSupport<T>) {
		this.#builder = builder;
	}

	get transaction(): Knex {
		return this.#builder.knex();
	}

	newFromObject(
		builder: QueryBuilderOperationSupport<T>,
		obj: QueryBuilderUserContext<T>,
	): QueryBuilderUserContext<T> {
		const ctx = new QueryBuilderUserContext(builder);
		Object.assign(ctx, obj);
		return ctx;
	}

	newMerge(
		builder: QueryBuilderOperationSupport<T>,
		obj: QueryBuilderUserContext<T>,
	): QueryBuilderUserContext<T> {
		const ctx = new QueryBuilderUserContext(builder);
		Object.assign(ctx, this, obj);
		return ctx;
	}
}
