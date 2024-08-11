import { QueryBuilderOperation } from './QueryBuilderOperation.ts';
import { StaticHookArguments } from '../StaticHookArguments.ts';
import knex from 'knex';
import { nany } from '../../ninja.ts';

export class DeleteOperation extends QueryBuilderOperation {
  async onBefore2(builder: nany, result: nany) {
    await callBeforeDelete(builder);
    return result;
  }

  onBuildKnex(knexBuilder: knex.Knex) {
    return knexBuilder.delete();
  }

  onAfter2(builder: nany, result: nany) {
    return callAfterDelete(builder, result);
  }

  toFindOperation() {
    return null;
  }
}

function callBeforeDelete(builder: nany) {
  return callStaticBeforeDelete(builder);
}

function callStaticBeforeDelete(builder: nany) {
  const args = StaticHookArguments.create({ builder });
  return builder.modelClass().beforeDelete(args);
}

function callAfterDelete(builder: nany, result: nany) {
  return callStaticAfterDelete(builder, result);
}

async function callStaticAfterDelete(builder: nany, result: nany) {
  const args = StaticHookArguments.create({ builder, result });
  const maybeResult = await builder.modelClass().afterDelete(args);

  if (maybeResult === undefined) {
    return result;
  } else {
    return maybeResult;
  }
}
