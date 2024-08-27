import { nany } from '../ninja.ts';
import { asArray, flatten, isString } from '../utils/object.ts';
import { Model } from './Model.ts';

export function parseJsonAttributes(
  json: Record<string, unknown>,
  modelClass: typeof Model,
) {
  const jsonAttr = modelClass.getJsonAttributes();

  if (jsonAttr.length) {
    // JSON attributes may be returned as strings depending on the database and
    // the database client. Convert them to objects here.
    for (let i = 0, l = jsonAttr.length; i < l; ++i) {
      const attr = jsonAttr[i];
      const value = json[attr];

      if (isString(value)) {
        const parsed = tryParseJson(value);

        // tryParseJson returns undefined if parsing failed.
        if (parsed !== undefined) {
          json[attr] = parsed;
        }
      }
    }
  }

  return json;
}

export function formatJsonAttributes(
  json: Record<string, unknown>,
  modelClass: typeof Model,
) {
  const jsonAttr = modelClass.getJsonAttributes();

  if (jsonAttr.length) {
    // All database clients want JSON columns as strings. Do the conversion here.
    for (let i = 0, l = jsonAttr.length; i < l; ++i) {
      const attr = jsonAttr[i];
      const value = json[attr];

      if (value != null) {
        json[attr] = JSON.stringify(value);
      }
    }
  }

  return json;
}

export function getJsonAttributes(modelClass: typeof Model) {
  let jsonAttributes = modelClass.jsonAttributes;

  if (Array.isArray(jsonAttributes)) {
    return jsonAttributes;
  }

  jsonAttributes = [];

  if (modelClass.getJsonSchema()) {
    const props = modelClass.getJsonSchema().properties || {};

    for (const propName of Object.keys(props)) {
      const prop = props[propName];
      let types = asArray(prop.type).filter((it) => !!it);

      if (types.length === 0 && Array.isArray(prop.anyOf)) {
        types = flatten(prop.anyOf.map((it: nany) => it.type));
      }

      if (types.length === 0 && Array.isArray(prop.oneOf)) {
        types = flatten(prop.oneOf.map((it: nany) => it.type));
      }

      if (types.indexOf('object') !== -1 || types.indexOf('array') !== -1) {
        jsonAttributes.push(propName);
      }
    }
  }

  return jsonAttributes;
}

export function tryParseJson(maybeJsonStr: unknown) {
  try {
    return JSON.parse(maybeJsonStr as string);
  } catch (_err) {
    return undefined;
  }
}
