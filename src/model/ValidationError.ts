import * as ninjaTs from '../ninja.ts';
import { enumerableProperty } from '../utils/decorators/enumerable.ts';
import { asArray, isString } from '../utils/object.ts';

enum ValidationErrorType {
  ModelValidation = 'ModelValidation',
  RelationExpression = 'RelationExpression',
  UnallowedRelation = 'UnallowedRelation',
  InvalidGraph = 'InvalidGraph',
}

export class ValidationError extends Error {
  static get Type() {
    return ValidationErrorType;
  }

  readonly type: string;
  readonly data?: unknown;
  readonly statusCode?: number;

  // Add as non-enumerable in case people are passing instances of
  // this error directly to `JSON.stringify`.
  @enumerableProperty(false)
  private modelClass: ninjaTs.nany;

  constructor(
    { type, message, modelClass, data = {}, statusCode = 400 }: {
      type: string;
      message?: string;
      modelClass: ninjaTs.nany;
      data?: unknown;
      statusCode?: number;
    },
  ) {
    super(message || errorsToMessage(data));

    this.name = this.constructor.name;
    this.type = type;
    this.data = data;
    this.statusCode = statusCode;
    this.modelClass = modelClass;
  }
}

// deno-lint-ignore no-explicit-any
function errorsToMessage(data: any) {
  return Object.keys(data)
    .reduce((messages, key) => {
      messages.push(`${key}: ${asArray(data[key]).map(message).join(', ')}`);
      return messages;
    }, [] as string[])
    .join(', ');
}

function message(it: string | { message: string }) {
  if (isString(it)) {
    return it;
  } else {
    return it.message;
  }
}
