import { nany } from '../ninja.ts';
import { Knex } from 'knex';

export class QueryBuilderUserContext {
	#builder: nany;

	constructor(builder: nany) {
		this.#builder = builder;
	}

	get transaction(): Knex {
		return this.#builder.knex();
	}

	newFromObject(builder: nany, obj: unknown): QueryBuilderUserContext {
		const ctx = new QueryBuilderUserContext(builder);
		Object.assign(ctx, obj);
		return ctx;
	}

	newMerge(builder: nany, obj: unknown): QueryBuilderUserContext {
		const ctx = new QueryBuilderUserContext(builder);
		Object.assign(ctx, this, obj);
		return ctx;
	}
}
