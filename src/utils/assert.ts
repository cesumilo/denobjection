import { nany } from '../ninja.ts';

export function assertHasId(model: nany) {
  if (!model.$hasId()) {
    const modelClass = model.constructor;
    const ids = modelClass.getIdColumnArray().join(', ');

    throw new Error(
      `one of the identifier columns [${ids}] is null or undefined. Have you specified the correct identifier column for the model '${modelClass.name}' using the 'idColumn' property?`,
    );
  }
}

export function assertIdNotUndefined(id: nany, message: string) {
  if (Array.isArray(id)) {
    id.forEach((id) => assertIdNotUndefined(id, message));
  } else if (id === undefined) {
    throw Error(message);
  }
}
