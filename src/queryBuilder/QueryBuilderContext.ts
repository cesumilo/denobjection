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

	override clone(): QueryBuilderContext<T> {
		return this.cloneInto(new QueryBuilderContext<T>());
	}

	override cloneInto(clone: QueryBuilderContext<T>): QueryBuilderContext<T> {
		super.cloneInto(clone);
		clone.runBefore = this.runBefore.slice();
		clone.runAfter = this.runAfter.slice();
		clone.onBuild = this.onBuild.slice();
		return clone;
	}
}
