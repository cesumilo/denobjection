import { Knex } from 'knex';
import { InternalOptions } from './InternalOptions.ts';
import { QueryBuilderUserContext } from './QueryBuilderUserContext.ts';
import {
	IModel,
	QueryBuilderOperationSupport,
} from './QueryBuilderOperationSupport.ts';

export class QueryBuilderContextBase<T extends IModel> {
	userContext?: QueryBuilderUserContext<T>;
	options?: InternalOptions;
	knex?: Knex;
	aliasMap?: Map<string, string>;
	tableMap?: Map<string, string>;

	constructor(builder?: QueryBuilderOperationSupport<T>) {
		this.userContext = builder
			? new QueryBuilderUserContext(builder)
			: undefined;
		this.options = builder ? new InternalOptions() : undefined;
	}

	static get InternalOptions() {
		return InternalOptions;
	}

	clone(): QueryBuilderContextBase<T> {
		const newContext = new QueryBuilderContextBase<T>();
		newContext.userContext = this.userContext;
		newContext.options = this.options?.clone();
		newContext.knex = this.knex;
		newContext.aliasMap = this.aliasMap;
		newContext.tableMap = this.tableMap;
		return newContext;
	}
}
