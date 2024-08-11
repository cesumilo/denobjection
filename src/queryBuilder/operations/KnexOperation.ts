import { nany } from '../../ninja.ts';
import { ObjectionToKnexConvertingOperation } from './ObjectionToKnexConvertingOperation.ts';
import { Knex } from 'knex';

type KnexBuilder = Knex.QueryBuilder | Knex.RawBuilder | Knex.SchemaBuilder;

// An operation that simply calls the equivalent knex method.
export class KnexOperation extends ObjectionToKnexConvertingOperation {
  constructor(name: string, opt: nany = {}) {
    super(name, opt);
  }

  onBuildKnex(knexBuilder: KnexBuilder, builder: nany) {
    return (knexBuilder as nany)[this.name].apply(
      knexBuilder,
      this.getKnexArgs(builder),
    );
  }
}
