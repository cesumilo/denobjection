export class SyntaxError extends Error {}

export type ParsedExpression = {
  columnName: string;
  column: string;
  table?: string;
  access: {
    type: 'object' | 'array';
    ref: string | number;
  }[];
};

const cache = new Map<string, ParsedExpression>();
const reservedKeys = ['.', '[', ']'];

function removeInvisibleCharactersAndSpaces(input: string): string {
  // deno-lint-ignore no-control-regex
  const invisibleCharsRegex = /[\u0000-\u001F\u007F\u0080-\u009F]/g;
  return input.replace(invisibleCharsRegex, '').trim();
}

function parseQuotes(
  del: "'" | '"',
  expr: string,
  endIdx: number,
): [number, boolean] {
  let onlyQuote = true;

  // check if more quotes
  const prevIdx = endIdx;
  while (endIdx < expr.length && expr[endIdx] === del) {
    endIdx++;
  }
  if (prevIdx < endIdx && endIdx < expr.length && expr[endIdx] !== ']') {
    throw new SyntaxError(`Expected "]" but "${expr[endIdx]}" found.`);
  }

  if (prevIdx <= endIdx && endIdx < expr.length && expr[endIdx] !== ']') {
    while (endIdx < expr.length && expr[endIdx] !== del) {
      if (expr[endIdx] !== del) {
        onlyQuote = false;
      }
      endIdx++;
    }
    if (endIdx < expr.length && expr[endIdx] !== del) {
      throw new SyntaxError(`Expected "${del}" but "${expr[endIdx]}" found.`);
    }
    if (endIdx < expr.length && expr[endIdx] === del && onlyQuote) {
      while (endIdx < expr.length && expr[endIdx] === del) {
        endIdx++;
      }
    }
    if (!onlyQuote) {
      endIdx++;
    }
  }

  return [endIdx, onlyQuote];
}

function parseArrayOrObjectReference(
  expr: string,
): [number | string, 'object' | 'array', number] {
  let endIdx = 0;
  let type: 'object' | 'array';
  let onlyQuote = true;

  if (/[0-9]/.test(expr[endIdx])) {
    type = 'array';
    while (endIdx < expr.length && /[0-9]/.test(expr[endIdx])) {
      endIdx++;
    }
    if (endIdx < expr.length && /["']/.test(expr[endIdx])) {
      throw new SyntaxError(`Expected "]" but "${expr[endIdx]}" found.`);
    }
    if (endIdx < expr.length && expr[endIdx] !== ']') {
      type = 'object';
      while (endIdx < expr.length && expr[endIdx] !== ']') {
        endIdx++;
      }
    }
  } else if (expr[endIdx] === "'" || expr[endIdx] === '"') {
    type = 'object';
    const del: "'" | '"' = expr[endIdx] as "'" | '"';
    endIdx++;
    const [newEndIdx, newOnlyQuote] = parseQuotes(del, expr, endIdx);
    onlyQuote = newOnlyQuote;
    endIdx = newEndIdx;
  } else {
    type = 'object';
    while (endIdx < expr.length && expr[endIdx] !== ']') {
      endIdx++;
    }
  }

  if (endIdx > expr.length) {
    throw new SyntaxError(`Expected "]" but end of input found.`);
  }
  if (expr[endIdx] !== ']') {
    throw new SyntaxError(`Expected "]" but "${expr[endIdx]}" found.`);
  }
  if (endIdx === 0 && expr[endIdx] === ']') {
    throw new SyntaxError('Expected a reference but "]" found');
  }

  if (type === 'array') {
    return [
      parseInt(expr.slice(0, endIdx)),
      type,
      endIdx + 1,
    ];
  }
  if (/["']/.test(expr[0]) && !onlyQuote) {
    return [
      expr.slice(1, endIdx - 1),
      type,
      endIdx + 1,
    ];
  }
  return [
    expr.slice(0, endIdx),
    type,
    endIdx + 1,
  ];
}

function parseObjectReference(expr: string): [string, number] {
  let endIdx = 0;

  while (endIdx < expr.length && !reservedKeys.includes(expr[endIdx])) {
    endIdx++;
  }

  return [expr.slice(0, endIdx), endIdx];
}

function parseJsonExpression(
  expr: string,
  output: ParsedExpression,
  firstRef: boolean = true,
): void {
  if (expr[0] === '[') {
    // array
    const newExpr = expr.slice(1);
    if (newExpr.length == 0) {
      throw new SyntaxError('Expected /[0-9+]/ but end of input found.');
    }

    const [ref, type, nextIdx] = parseArrayOrObjectReference(newExpr);
    output.access.push({
      type,
      ref,
    });
    if (nextIdx >= newExpr.length) return;
    parseJsonExpression(newExpr.slice(nextIdx), output, false);
  } else if (expr[0] === '.') {
    // object
    const newExpr = expr.slice(1);
    if (newExpr.length == 0) {
      throw new SyntaxError(`Expected none of "[]." but end of input found.`);
    }

    const [ref, nextIdx] = parseObjectReference(newExpr);
    output.access.push({
      type: 'object',
      ref,
    });
    if (nextIdx >= newExpr.length) return;
    parseJsonExpression(newExpr.slice(nextIdx), output, false);
  } else if (firstRef && !reservedKeys.includes(expr[0])) {
    // object
    const [ref, nextIdx] = parseObjectReference(expr.slice(0));
    output.access.push({
      type: 'object',
      ref,
    });
    if (nextIdx >= expr.length) return;
    parseJsonExpression(expr.slice(nextIdx), output, false);
  } else {
    throw new SyntaxError(
      `Expected "[" or "." but "${expr[0]}" found.`,
    );
  }
}

export function parseFieldExpression(expr: string): ParsedExpression {
  const parsedExpr = cache.get(expr);
  if (parsedExpr) {
    return parsedExpr;
  }

  const output: ParsedExpression = {
    columnName: '',
    column: '',
    access: [],
  };
  const containsSemi = expr.includes(':');
  const semiParts = expr.split(':');
  let parts: string[];

  if (containsSemi && semiParts.length === 2 && !semiParts[0]) {
    throw new SyntaxError('No column found.');
  } else if (containsSemi) {
    parts = [semiParts[0], semiParts.slice(1).join(':')].map((x) =>
      removeInvisibleCharactersAndSpaces(x)
    );
  } else {
    parts = semiParts.map((x) => removeInvisibleCharactersAndSpaces(x));
  }

  const subParts = parts[0].split('.');

  output.column = subParts[subParts.length - 1];
  output.table = subParts.length > 1
    ? subParts.slice(0, subParts.length - 1).join('.')
    : undefined;
  output.columnName = [output.table, output.column].filter((x) => x).join('.');

  if (parts.length === 1) {
    return output;
  }

  const jsonExpr = parts[1];
  if (!jsonExpr.length) {
    throw new SyntaxError(
      `Expected either "[" or none of "[]." but end of input found.`,
    );
  }
  if (jsonExpr[0] === '.' || jsonExpr[0] === ']') {
    throw new SyntaxError(
      `Expected either "[" or none of "[]." but "${jsonExpr[0]}" found.`,
    );
  }

  parseJsonExpression(jsonExpr, output);
  cache.set(expr, output);

  return output;
}
