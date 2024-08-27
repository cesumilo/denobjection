import { difference } from '../utils/object.ts';
import { Model } from './Model.ts';

/**
 * The function `columnNameToPropertyName` converts a column name to a corresponding property name in a
 * model class.
 * @param modelClass - The `modelClass` parameter is the class of the model for which you want to
 * convert a column name to a property name.
 * @param {string} columnName - The `columnNameToPropertyName` function takes two parameters:
 * @returns The function `columnNameToPropertyName` returns a string value, which is either the
 * property name corresponding to the given column name in the model class, or the original column name
 * if no corresponding property name is found.
 */
export function columnNameToPropertyName(
  modelClass: typeof Model,
  columnName: string,
): string {
  const model = new modelClass();
  const addedProps = Object.keys(model.$parseDatabaseJson({}));

  const row: Record<string, unknown> = {};
  row[columnName] = null;

  const props = Object.keys(model.$parseDatabaseJson(row));
  const propertyName = difference(props, addedProps)[0];

  return propertyName || columnName;
}

/**
 * The function `propertyNameToColumnName` converts a property name to a corresponding column name in a
 * database table based on a given model class.
 * @param modelClass - The `modelClass` parameter is a reference to a class that extends a Model class,
 * which is likely used in an ORM (Object-Relational Mapping) framework for interacting with a
 * database.
 * @param {string} propertyName - The `propertyNameToColumnName` function takes in two parameters:
 * @returns The function `propertyNameToColumnName` returns a string value, which is either the column
 * name corresponding to the given `propertyName` in the database table represented by the
 * `modelClass`, or if no corresponding column is found, it returns the original `propertyName`.
 */
export function propertyNameToColumnName(
  modelClass: typeof Model,
  propertyName: string,
): string {
  const model = new modelClass();
  const addedCols = Object.keys(model.$formatDatabaseJson({}));

  const obj: Record<string, unknown> = {};
  obj[propertyName] = null;

  const cols = Object.keys(model.$formatDatabaseJson(obj));
  const columnName = difference(cols, addedCols)[0];

  return columnName || propertyName;
}
