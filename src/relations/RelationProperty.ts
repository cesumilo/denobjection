import { asArray, get, isObject, set, uniqBy } from '../utils/object.ts';
import { ref as createRef } from '../queryBuilder/ReferenceBuilder.ts';
import { PROP_KEY_PREFIX, propToStr } from '../model/modelValues.ts';
import { Model } from '../model/Model.ts';
import { ReferenceBuilder } from '../queryBuilder/ReferenceBuilder.ts';
import { ParsedExpression } from '../utils/parseFieldExpression.ts';
import { nany } from '../ninja.ts';

export class ModelNotFoundError extends Error {
  readonly tableName: string;

  constructor(tableName: string) {
    super();
    this.name = this.constructor.name;
    this.tableName = tableName;
  }
}

export class InvalidReferenceError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
  }
}

// A pair of these define how two tables are related to each other.
// Both the owner and the related table have one of these.
//
// A relation property can be a single column, an array of columns
// (composite key) a json column reference, an array of json column
// references or any combination of the above.
export class RelationProperty {
  // references must be a reference string like `Table.column:maybe.some.json[1].path`.
  // or an array of such references (composite key).
  //
  // modelClassResolver must be a function that takes a table name
  // and returns a model class.
  protected _modelClass: typeof Model;
  // deno-lint-ignore no-explicit-any
  protected _refs: ReferenceBuilder<any>[];
  protected _props: (string | number)[];
  protected _cols: string[];
  protected _propGetters: ((obj: nany) => nany)[];
  protected _propSetters: ((obj: nany, value: nany) => void)[];
  protected _patchers: ((patch: nany, value: nany) => void)[];

  constructor(
    references: string | string[],
    modelClassResolver: (tableName: string) => typeof Model,
  ) {
    const refs = createRefs(asArray(references));
    const paths = createPaths(refs, modelClassResolver);
    const modelClass = resolveModelClass(paths);

    this._refs = refs.map((ref) => ref.model(modelClass));
    this._modelClass = modelClass;
    this._props = paths.map((it) => it.path[0]);
    this._cols = refs.map((it) => it.column as string); // TODO: why it is undefined?
    this._propGetters = paths.map((it) => createGetter(it.path));
    this._propSetters = paths.map((it) => createSetter(it.path));
    this._patchers = refs.map((it, i) => createPatcher(it, paths[i].path));
  }

  static get ModelNotFoundError() {
    return ModelNotFoundError;
  }

  static get InvalidReferenceError() {
    return InvalidReferenceError;
  }

  // The number of columns.
  get size() {
    return this._refs.length;
  }

  // The model class that owns the property.
  get modelClass() {
    return this._modelClass;
  }

  // An array of property names. Contains multiple values in case of composite key.
  // This may be different from `cols` if the model class has some kind of conversion
  // between database and "external" formats, for example a snake_case to camelCase
  // conversion.
  get props() {
    return this._props;
  }

  // An array of column names. Contains multiple values in case of composite key.
  // This may be different from `props` if the model class has some kind of conversion
  // between database and "external" formats, for example a snake_case to camelCase
  // conversion.
  get cols() {
    return this._cols;
  }

  forEach(callback: (i: number) => void) {
    for (let i = 0, l = this.size; i < l; ++i) {
      callback(i);
    }
  }

  // Creates a concatenated string from the property values of the given object.
  propKey(obj: nany) {
    const size = this.size;
    let key = PROP_KEY_PREFIX;

    for (let i = 0; i < size; ++i) {
      key += propToStr(this.getProp(obj, i));

      if (i !== size - 1) {
        key += ',';
      }
    }

    return key;
  }

  // Returns the property values of the given object as an array.
  getProps(obj: nany) {
    const size = this.size;
    const props = new Array(size);

    for (let i = 0; i < size; ++i) {
      props[i] = this.getProp(obj, i);
    }

    return props;
  }

  // Returns true if the given object has a non-null value in all properties.
  hasProps(obj: nany) {
    const size = this.size;

    for (let i = 0; i < size; ++i) {
      const prop = this.getProp(obj, i);

      if (prop === null || prop === undefined) {
        return false;
      }
    }

    return true;
  }

  // Returns the index:th property value of the given object.
  getProp(obj: nany, index: number) {
    return this._propGetters[index](obj);
  }

  // Sets the index:th property value of the given object.
  setProp(obj: nany, index: number, value: nany) {
    return this._propSetters[index](obj, value);
  }

  // Returns an instance of ReferenceBuilder that points to the index:th
  // value of a row.
  ref(builder: nany, index: number) {
    const table = builder.tableRefFor(this.modelClass);

    return this._refs[index].clone().table(table);
  }

  // Returns an array of reference builders. `ref(builder, i)` for each i.
  refs(builder: nany) {
    const refs = new Array(this.size);

    for (let i = 0, l = refs.length; i < l; ++i) {
      refs[i] = this.ref(builder, i);
    }

    return refs;
  }

  // Appends an update operation for the index:th column into `patch` object.
  patch(patch: nany, index: number, value: nany) {
    return this._patchers[index](patch, value);
  }

  // String representation of this property's index:th column for logging.
  propDescription(index: number) {
    return this._refs[index].expression;
  }
}

// deno-lint-ignore no-explicit-any
function createRefs(refs: (string | ReferenceBuilder<any>)[]) {
  try {
    return refs.map((it) => {
      if (!isObject(it) || !(it instanceof ReferenceBuilder)) {
        return createRef(it);
      } else {
        return it;
      }
    });
  } catch (_err) {
    throw new InvalidReferenceError();
  }
}

function createPaths(
  // deno-lint-ignore no-explicit-any
  refs: ReferenceBuilder<any>[],
  modelClassResolver: (tableName: string) => typeof Model,
) {
  return refs.map((ref) => {
    if (!ref.tableName) {
      throw new InvalidReferenceError();
    }

    const modelClass = modelClassResolver(ref.tableName);

    if (!modelClass) {
      throw new ModelNotFoundError(ref.tableName);
    }

    const prop = modelClass.columnNameToPropertyName(ref.column as string); // TODO why it can be undefined?
    const jsonPath = (ref.parsedExpr as ParsedExpression).access.map((it) =>
      it.ref
    ); // TODO why it can be undefined?

    return {
      path: ([prop] as (string | number)[]).concat(jsonPath),
      modelClass,
    };
  });
}

function resolveModelClass(
  paths: { path: (string | number)[]; modelClass: typeof Model }[],
) {
  const modelClasses = paths.map((it) => it.modelClass);
  const uniqueModelClasses = uniqBy(modelClasses);

  if (uniqueModelClasses.length !== 1) {
    throw new InvalidReferenceError();
  }

  return modelClasses[0];
}

function createGetter(path: (string | number)[]) {
  if (path.length === 1) {
    const prop = path[0];
    return (obj: nany) => obj[prop];
  } else {
    return (obj: nany) => get(obj, path);
  }
}

function createSetter(path: (string | number)[]) {
  if (path.length === 1) {
    const prop = path[0];
    return (obj: nany, value: nany) => (obj[prop] = value);
  } else {
    return (obj: nany, value: nany) => set(obj, path, value);
  }
}

// deno-lint-ignore no-explicit-any
function createPatcher(ref: ReferenceBuilder<any>, path: (string | number)[]) {
  if (ref.isPlainColumnRef) {
    return (patch: nany, value: nany) => (patch[path[0]] = value);
  } else {
    // Objection `patch`, `update` etc. methods understand field expressions.
    return (patch: nany, value: nany) => (patch[ref.expression] = value);
  }
}
