import { nany } from '../ninja.ts';
import { QueryBuilderContextBase } from './QueryBuilderContextBase.ts';

export class QueryBuilderContext extends QueryBuilderContextBase {
	runBefore: nany[];
	runAfter: nany[];
	onBuild: nany[];

	constructor(builder?: nany) {
		super(builder);

		this.runBefore = [];
		this.runAfter = [];
		this.onBuild = [];
	}

	clone() {
		const ctx = new QueryBuilderContext();
		super.cloneInto(ctx);

		ctx.runBefore = this.runBefore.slice();
		ctx.runAfter = this.runAfter.slice();
		ctx.onBuild = this.onBuild.slice();

		return ctx;
	}
}
