import { nany } from '../ninja.ts';
import { QueryBuilderContextBase } from './QueryBuilderContextBase.ts';
import { IModel } from './QueryBuilderOperationSupport.ts';

export class QueryBuilderContext<T extends IModel>
	extends QueryBuilderContextBase<T> {
	runBefore: nany[];
	runAfter: nany[];
	onBuild: nany[];

	constructor(builder?: nany) {
		super(builder);

		this.runBefore = [];
		this.runAfter = [];
		this.onBuild = [];
	}

	override clone() {
		const ctx = new QueryBuilderContext<T>();

		ctx.userContext = this.userContext;
		ctx.options = this.options?.clone();
		ctx.knex = this.knex;
		ctx.aliasMap = this.aliasMap;
		ctx.tableMap = this.tableMap;

		ctx.runBefore = this.runBefore.slice();
		ctx.runAfter = this.runAfter.slice();
		ctx.onBuild = this.onBuild.slice();

		return ctx;
	}
}
