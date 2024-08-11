import { ALIAS_REGEX } from '../../../constants/regexps.ts';
import { nany } from '../../../ninja.ts';
import { isString } from '../../../utils/object.ts';
import { RawBuilder } from '../../RawBuilder.ts';
import { ReferenceBuilder } from '../../ReferenceBuilder.ts';

export type AnySelection =
  | Selection
  | ReferenceBuilder<nany>
  | RawBuilder
  | string
  // deno-lint-ignore no-explicit-any
  | any;

/**
 * Represents a selection in a query.
 */
export class Selection {
  private table?: string;
  private column?: string;
  private alias?: string;

  constructor(table?: string, column?: string, alias?: string) {
    this.table = table;
    this.column = column;
    this.alias = alias;
  }

  /**
   * Gets the name of the selection.
   * If an alias is defined, it returns the alias.
   * Otherwise, it returns the column name.
   *
   * @returns The name of the selection.
   */
  get name() {
    return this.alias || this.column;
  }

  static create(selection: string): Selection;
  // deno-lint-ignore no-explicit-any
  static create(selection: ReferenceBuilder<any>): Selection;
  static create(selection: RawBuilder): Selection;
  static create(selection: Selection): Selection;
  /**
   * Creates a Selection object based on the given input.
   *
   * @param selection - The input selection.
   * @returns A Selection object if the input is valid, otherwise null.
   */
  static create(
    selection: AnySelection,
  ): Selection | null {
    if (selection instanceof Selection) {
      return selection;
    } else if (selection instanceof ReferenceBuilder) {
      return createSelectionFromReference(selection);
    } else if (selection instanceof RawBuilder) {
      return createSelectionFromRaw(selection);
    } else if (isString(selection)) {
      return createSelectionFromString(selection);
    }
    return null;
  }

  /**
   * Returns true if `selectionInBuilder` causes `selectionToTest` to be selected.
   *
   * @param builder - The builder object.
   * @param selectionInBuilderString - The selection in the builder as a string.
   * @param selectionToTestString - The selection to test as a string.
   * @returns True if the selections match, false otherwise.
   * @example
   *
   * Examples that return true:
   *
   * doesSelect(Person.query(), '*', 'name')
   * doesSelect(Person.query(), 'Person.*', 'name')
   * doesSelect(Person.query(), 'name', 'name')
   * doesSelect(Person.query(), 'name', 'Person.name')
   */
  static doesSelect(
    builder: nany,
    selectionInBuilderString: AnySelection,
    selectionToTestString: AnySelection,
  ) {
    const selectionInBuilder = Selection.create(selectionInBuilderString);
    const selectionToTest = Selection.create(selectionToTestString);

    if (selectionInBuilder.column === '*') {
      if (selectionInBuilder.table) {
        if (selectionToTest.column === '*') {
          return selectionToTest.table === selectionInBuilder.table;
        } else {
          return (
            !selectionToTest.table ||
            selectionToTest.table === selectionInBuilder.table
          );
        }
      } else {
        return true;
      }
    } else {
      const selectionInBuilderTable = selectionInBuilder.table ||
        builder.tableRef();

      if (selectionToTest.column === '*') {
        return false;
      } else {
        return (
          selectionToTest.column === selectionInBuilder.column &&
          (!selectionToTest.table ||
            selectionToTest.table === selectionInBuilderTable)
        );
      }
    }
  }
}

/**
 * Creates a selection from a reference.
 *
 * @param ref - The reference builder.
 * @returns A new selection object.
 */
// deno-lint-ignore no-explicit-any
function createSelectionFromReference(ref: ReferenceBuilder<any>): Selection {
  return new Selection(ref.tableName, ref.column, ref.alias);
}

/**
 * Creates a Selection object from a RawBuilder.
 *
 * @param raw - The RawBuilder object to create the Selection from.
 * @returns A Selection object if the raw object has an alias, otherwise null.
 */
function createSelectionFromRaw(raw: RawBuilder): Selection | null {
  if (raw.alias) {
    return new Selection(undefined, undefined, raw.alias);
  } else {
    return null;
  }
}

/**
 * Creates a Selection object from a string representation.
 *
 * @param selection - The string representation of the selection.
 * @returns A Selection object representing the selection.
 */
function createSelectionFromString(selection: string): Selection {
  let table = undefined;
  let column = undefined;
  let alias = undefined;

  if (ALIAS_REGEX.test(selection)) {
    const parts = selection.split(ALIAS_REGEX);

    selection = parts[0].trim();
    alias = parts[1].trim();
  }

  const dotIdx = selection.lastIndexOf('.');

  if (dotIdx !== -1) {
    table = selection.substr(0, dotIdx);
    column = selection.substr(dotIdx + 1);
  } else {
    column = selection;
  }

  return new Selection(table, column, alias);
}
