import { ObjectionToKnexConvertingOperation } from './ObjectionToKnexConvertingOperation.ts';
import { isPlainObject, isString } from '../../utils/object.ts';
import { HasOnAdd, HasOnBuildKnex } from './QueryBuilderOperation.ts';
import { nany } from '../../ninja.ts';

const ALIAS_REGEX = /\s+as\s+/i;

// FromOperation corresponds to a `.from(args)` call. The call is delegated to
// knex, but we first try to parse the arguments so that we can determine which
// tables have been mentioned in a query's from clause. We only parse string
// references and not `raw` or `ref` etc. references at this point thouhg.
export class FromOperation extends ObjectionToKnexConvertingOperation
  implements HasOnAdd, HasOnBuildKnex {
  private table?: string;
  private alias?: string;

  constructor(name: string, opt: nany) {
    super(name, opt);
  }

  override onAdd(builder: nany, ...args: nany[]) {
    const ret = super.onAdd(builder, args);
    const parsed = parseTableAndAlias(this.args[0], builder);

    if (parsed.table) {
      builder.tableName(parsed.table);
      this.table = parsed.table;
    }

    if (parsed.alias) {
      builder.aliasFor(builder.modelClass().getTableName(), parsed.alias);
      this.alias = parsed.alias;
    }

    return ret;
  }

  onBuildKnex(knexBuilder: nany, builder: nany) {
    // Simply call knex's from method with the converted arguments.
    return knexBuilder.from.apply(knexBuilder, this.getKnexArgs(builder));
  }

  override clone() {
    const clone = new FromOperation(this.name, this.opt);
    super.cloneInto(clone);

    clone.table = this.table;
    clone.alias = this.alias;

    return clone;
  }
}

function parseTableAndAlias(arg: nany, builder: nany) {
  if (isString(arg)) {
    return parseTableAndAliasFromString(arg);
  } else if (isPlainObject(arg)) {
    return parseTableAndAliasFromObject(arg, builder);
  } else {
    // Could not parse table and alias from the arguments.
    return {
      table: undefined,
      alias: undefined,
    };
  }
}

function parseTableAndAliasFromString(arg: nany) {
  if (ALIAS_REGEX.test(arg)) {
    const parts = arg.split(ALIAS_REGEX);

    return {
      table: parts[0].trim(),
      alias: parts[1].trim(),
    };
  } else {
    return {
      table: arg.trim(),
      alias: null,
    };
  }
}

function parseTableAndAliasFromObject(arg: nany, builder: nany) {
  for (const alias of Object.keys(arg)) {
    const table = arg[alias].trim();

    if (table === builder.modelClass().getTableName()) {
      return {
        alias,
        table,
      };
    }
  }

  throw new Error(
    `one of the tables in ${
      JSON.stringify(arg)
    } must be the query's model class's table.`,
  );
}
