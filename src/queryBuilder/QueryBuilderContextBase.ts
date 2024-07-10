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
		return this.cloneInto(new QueryBuilderContextBase<T>());
	}

	cloneInto(context: QueryBuilderContextBase<T>): QueryBuilderContextBase<T> {
		context.userContext = this.userContext;
		context.options = this.options?.clone();
		context.knex = this.knex;
		context.aliasMap = this.aliasMap;
		context.tableMap = this.tableMap;
		return context;
	}
}
