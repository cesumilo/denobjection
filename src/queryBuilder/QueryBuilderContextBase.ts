import { Knex } from 'knex';
import { nany } from '../ninja.ts';
import { InternalOptions } from './InternalOptions.ts';
import { QueryBuilderUserContext } from './QueryBuilderUserContext.ts';

export class QueryBuilderContextBase {
	userContext?: QueryBuilderUserContext;
	options?: InternalOptions;
	knex?: Knex;
	aliasMap?: Map<nany, nany>;
	tableMap?: Map<nany, nany>;

	constructor(builder?: nany) {
		this.userContext = builder
			? new QueryBuilderUserContext(builder)
			: undefined;
		this.options = builder ? new InternalOptions() : undefined;
	}

	static get InternalOptions() {
		return InternalOptions;
	}

	cloneInto(
		newContext: QueryBuilderContextBase,
	): void {
		newContext.userContext = this.userContext;
		newContext.options = this.options?.clone();
		newContext.knex = this.knex;
		newContext.aliasMap = this.aliasMap;
		newContext.tableMap = this.tableMap;
	}
}
