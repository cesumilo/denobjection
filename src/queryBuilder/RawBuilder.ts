import { isPlainObject } from '../utils/object.ts';
import { buildArg } from '../utils/build.ts';
import { nany } from '../ninja.ts';
import { Knex } from 'knex';

export interface BuilderWithKnex {
	knex(): Knex;
}

export class RawBuilder {
	#sql: string;
	#args: nany[];
	#as?: string;

	constructor(sql: string, args: nany[]) {
		this.#sql = `${sql}`;
		this.#args = args;
	}

	get alias(): string | undefined {
		return this.#as;
	}

	as(as: string) {
		this.#as = as;
		return this;
	}

	toKnexRaw(builder: BuilderWithKnex): Knex.Raw {
		let args = null;
		let sql = this.#sql;

		if (this.#args.length === 1 && isPlainObject(this.#args[0])) {
			args = buildObject(this.#args[0], builder);

			if (this.#as) {
				args.__alias__ = this.#as;
				sql += ' as :__alias__:';
			}
		} else {
			args = buildArray(this.#args, builder);

			if (this.#as) {
				args.push(this.#as);
				sql += ' as ??';
			}
		}

		return builder.knex().raw(sql, args);
	}
}

export function buildArray(arr: nany[], builder: nany) {
	return arr.map((it) => buildArg(it, builder));
}

export function buildObject(obj: nany, builder: nany) {
	return Object.keys(obj).reduce((args, key) => {
		args[key] = buildArg(obj[key], builder);
		return args;
	}, {} as nany);
}

export function normalizeRawArgs(argsIn: [string, ...nany[]]) {
	const [sql, ...restArgs] = argsIn;

	if (restArgs.length === 1 && Array.isArray(restArgs[0])) {
		return {
			sql,
			args: restArgs[0],
		};
	} else {
		return {
			sql,
			args: restArgs,
		};
	}
}

export function raw(...argsIn: [string, ...nany[]]) {
	const { sql, args } = normalizeRawArgs(argsIn);
	return new RawBuilder(sql, args);
}
