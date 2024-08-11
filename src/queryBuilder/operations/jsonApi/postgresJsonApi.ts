import { parseFieldExpression as parser } from '../../../utils/parseFieldExpression.ts';
import { asArray, isObject, isString } from '../../../utils/object.ts';
import { Knex } from 'knex';
import { nany } from '../../../ninja.ts';

/**
 * @typedef {String} FieldExpression
 *
 * Field expressions allow one to refer to separate JSONB fields inside columns.
 *
 * Syntax: <column reference>[:<json field reference>]
 *
 * e.g. `Person.jsonColumnName:details.names[1]` would refer to value `'Second'`
 * in column `Person.jsonColumnName` which has
 * `{ details: { names: ['First', 'Second', 'Last'] } }` object stored in it.
 *
 * First part `<column reference>` is compatible with column references used in
 * knex e.g. `MyFancyTable.tributeToThBestColumnNameEver`.
 *
 * Second part describes a path to an attribute inside the referred column.
 * It is optional and it always starts with colon which follows directly with
 * first path element. e.g. `Table.jsonObjectColumnName:jsonFieldName` or
 * `Table.jsonArrayColumn:[321]`.
 *
 * Syntax supports `[<key or index>]` and `.<key or index>` flavors of reference
 * to json keys / array indexes:
 *
 * e.g. both `Table.myColumn:[1][3]` and `Table.myColumn:1.3` would access correctly
 * both of the following objects `[null, [null,null,null, "I was accessed"]]` and
 * `{ "1": { "3" : "I was accessed" } }`
 *
 * Caveats when using special characters in keys:
 *
 * 1. `objectColumn.key` This is the most common syntax, good if you are
 *    not using dots or square brackets `[]` in your json object key name.
 * 2. Keys containing dots `objectColumn:[keywith.dots]` Column `{ "keywith.dots" : "I was referred" }`
 * 3. Keys containing square brackets `column['[]']` `{ "[]" : "This is getting ridiculous..." }`
 * 4. Keys containing square brackets and quotes
 *    `objectColumn:['Double."Quote".[]']` and `objectColumn:["Sinlge.'Quote'.[]"]`
 *    Column `{ "Double.\"Quote\".[]" : "I was referred",  "Single.'Quote'.[]" : "Mee too!" }`
 * 99. Keys containing dots, square brackets, single quotes and double quotes in one json key is
 *     not currently supported
 */

export function parseFieldExpression(
  expression: string,
  extractAsText: boolean = false,
): string {
  const parsed = parser(expression);
  const jsonRefs = parsed.access.map((it) => it.ref).join(',');
  const extractor = extractAsText ? '#>>' : '#>';
  const middleQuotedColumnName = parsed.columnName.split('.').join('"."');
  return `"${middleQuotedColumnName}"${extractor}'{${jsonRefs}}'`;
}

/**
 * Applies a WHERE clause to the query builder using the JSONB reference on the left and a JSONB value or reference on the right.
 *
 * @param builder - The query builder.
 * @param fieldExpression - The field expression.
 * @param operator - The operator.
 * @param jsonObjectOrFieldExpression - The JSON object or field expression.
 * @param queryPrefix - The query prefix.
 * @returns The modified query builder.
 */
export function whereJsonbRefOnLeftJsonbValOrRefOnRight(
  builder: nany,
  fieldExpression: string,
  operator: string,
  jsonObjectOrFieldExpression: string | Record<string, unknown>,
  queryPrefix: string,
): nany { // TODO - type
  const queryParams = whereJsonbRefOnLeftJsonbValOrRefOnRightRawQueryParams(
    fieldExpression,
    operator,
    jsonObjectOrFieldExpression,
    queryPrefix,
  );
  return builder.whereRaw.apply(builder, queryParams);
}

/**
 * Performs a JSONB query operation where the left-hand side is a JSONB field reference and the right-hand side is either a JSONB value or a JSONB field reference.
 *
 * @param fieldExpression - The field expression representing the left-hand side of the query.
 * @param operator - The operator to use in the query.
 * @param jsonObjectOrFieldExpression - The JSONB value or field expression representing the right-hand side of the query.
 * @param queryPrefix - The optional prefix to prepend to the query.
 * @returns An array of strings representing the generated query.
 * @throws {Error} If the right-hand expression is invalid.
 */
export function whereJsonbRefOnLeftJsonbValOrRefOnRightRawQueryParams(
  fieldExpression: string,
  operator: string,
  jsonObjectOrFieldExpression: string | Record<string, unknown>,
  queryPrefix: string,
): string[] {
  const fieldReference = parseFieldExpression(fieldExpression);

  if (isString(jsonObjectOrFieldExpression)) {
    const rightHandReference = parseFieldExpression(
      jsonObjectOrFieldExpression,
    );
    const refRefQuery = [
      '(',
      fieldReference,
      ')::jsonb',
      operator,
      '(',
      rightHandReference,
      ')::jsonb',
    ];
    if (queryPrefix) {
      refRefQuery.unshift(queryPrefix);
    }
    return [refRefQuery.join(' ')];
  } else if (isObject(jsonObjectOrFieldExpression)) {
    const refValQuery = ['(', fieldReference, ')::jsonb', operator, '?::jsonb'];
    if (queryPrefix) {
      refValQuery.unshift(queryPrefix);
    }
    return [refValQuery.join(' '), JSON.stringify(jsonObjectOrFieldExpression)];
  }

  throw new Error('Invalid right hand expression.');
}

/**
 * Builds a query for filtering JSON fields in a PostgreSQL JSON API based on a right-hand string array on the left-hand field.
 *
 * @param knex - The Knex instance used for querying the database.
 * @param fieldExpression - The expression representing the JSON field to filter on.
 * @param operator - The operator to use for the comparison.
 * @param keys - The keys to search for in the JSON field. Can be a single key or an array of keys.
 * @returns The generated query string.
 * @throws An error if any of the keys are not strings.
 */
export function whereJsonFieldRightStringArrayOnLeftQuery(
  knex: Knex,
  fieldExpression: string,
  operator: string,
  keys: (string | unknown) | (string | unknown)[],
): string {
  const fieldReference = parseFieldExpression(fieldExpression);
  const keysArr = asArray<string | unknown>(keys);

  const questionMarksArray = keysArr.map((key) => {
    if (!isString(key)) {
      throw new Error('All keys to find must be strings.');
    }
    return '?';
  });

  const rawSqlTemplateString = 'array[' + questionMarksArray.join(',') + ']';
  const rightHandExpression = knex.raw(rawSqlTemplateString, keysArr);

  return `${fieldReference} ${
    operator.replace('?', '\\?')
  } ${rightHandExpression}`;
}

/**
 * Builds a WHERE clause for a JSON field query.
 *
 * @param knex - The Knex instance.
 * @param fieldExpression - The field expression for the JSON field.
 * @param operator - The operator for the comparison.
 * @param value - The value to compare against.
 * @returns The generated WHERE clause as a string.
 * @throws {Error} If the value is not a string, number, boolean, or null.
 */
export function whereJsonFieldQuery(
  knex: Knex,
  fieldExpression: string,
  operator: string,
  value: unknown,
): string {
  const fieldReference = parseFieldExpression(fieldExpression, true);
  const normalizedOperator = normalizeOperator(knex, operator);

  // json type comparison takes json type in string format
  let cast: string;
  let escapedValue: Knex.Raw | string = knex.raw(' ?', [value]);
  const type = typeof value;

  if (type === 'number') {
    cast = '::NUMERIC';
  } else if (type === 'boolean') {
    cast = '::BOOLEAN';
  } else if (type === 'string') {
    cast = '::TEXT';
  } else if (value === null) {
    cast = '::TEXT';
    escapedValue = 'NULL';
  } else {
    throw new Error('Value must be string, number, boolean or null.');
  }

  return `(${fieldReference})${cast} ${normalizedOperator} ${escapedValue}`;
}

/**
 * Normalizes the given operator for use in a PostgreSQL JSON API query.
 *
 * @param knex - The Knex instance.
 * @param operator - The operator to normalize.
 * @returns The normalized operator.
 */
// deno-lint-ignore no-explicit-any
function normalizeOperator(knex: Knex, operator: string): any {
  const trimmedLowerCase = operator.trim().toLowerCase();

  switch (trimmedLowerCase) {
    case 'is':
    case 'is not':
      return trimmedLowerCase;
    default:
      return knex.client.formatter().operator(operator);
  }
}
