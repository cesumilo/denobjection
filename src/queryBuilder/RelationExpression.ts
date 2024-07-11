import { Node, parseRelExpr } from './parsers/relationExpressionParser.ts';
import { isNumber, isObject, isString, union } from '../utils/object.ts';
import { Model } from '../model/Model.ts';
import { nany } from '../ninja.ts';
// import { RelationDoesNotExistError } from '../model/RelationDoesNotExistError.ts';

class RelationDoesNotExistError extends Error {}
export class RelationExpressionParseError extends Error {}
export class DuplicateRelationError extends RelationExpressionParseError {
  relationName: string;

  constructor(relationName: string) {
    super();
    this.relationName = relationName;
  }
}

export class RelationExpression {
  node: Node;
  recursionDepth: number;

  constructor(node = newNode(), recursionDepth = 0) {
    this.node = node;
    this.recursionDepth = recursionDepth;
  }

  get isObjectionRelationExpression() {
    return true;
  }

  // Create a relation expression from a string, a pojo or another
  // RelationExpression instance.
  static create(expr?: string | RelationExpression | Node): RelationExpression {
    if (isObject(expr)) {
      if (expr.isObjectionRelationExpression) {
        return expr as unknown as RelationExpression;
      } else {
        return new RelationExpression(normalizeNode(expr));
      }
    } else if (isString(expr)) {
      if (!expr.trim()) {
        return new RelationExpression();
      } else {
        try {
          return new RelationExpression(parse(expr));
        } catch (err) {
          if (err.duplicateRelationName) {
            throw new DuplicateRelationError(err.duplicateRelationName);
          } else {
            throw new RelationExpressionParseError(err.message);
          }
        }
      }
    } else {
      return new RelationExpression();
    }
  }

  // Create a relation expression from a model graph.
  // TODO proper type for graph
  static fromModelGraph(graph?: nany) {
    if (!graph) {
      return new RelationExpression();
    } else {
      return new RelationExpression(modelGraphToNode(graph, newNode()));
    }
  }

  get maxRecursionDepth() {
    if (isNumber(this.node.$recursive)) {
      return this.node.$recursive;
    } else {
      return this.node.$recursive ? Number.MAX_SAFE_INTEGER : 0;
    }
  }

  get numChildren() {
    return this.node.$childNames.length;
  }

  get isEmpty() {
    return this.numChildren === 0;
  }

  // Merges this relation expression with another. `expr` can be a string,
  // a pojo, or a RelationExpression instance.
  merge(expr?: string | RelationExpression | Node) {
    expr = RelationExpression.create(expr);

    if (this.isEmpty) {
      // Nothing to merge.
      return expr;
    }

    return new RelationExpression(mergeNodes(this.node, expr.node));
  }

  // Returns true if `expr` is contained by this expression. For example
  // `a.b` is contained by `a.[b, c]`.
  isSubExpression(expr?: string | RelationExpression | Node) {
    if (this.node.$allRecursive) {
      return true;
    }

    expr = RelationExpression.create(expr);

    if (expr.node.$allRecursive) {
      return this.node.$allRecursive;
    }

    if (this.node.$relation !== expr.node.$relation) {
      return false;
    }

    const maxRecursionDepth = expr.maxRecursionDepth;

    if (maxRecursionDepth > 0) {
      return this.node.$allRecursive ||
        this.maxRecursionDepth >= maxRecursionDepth;
    }

    for (const childName of expr.node.$childNames) {
      const ownSubExpression = this.childExpression(childName);
      const subExpression = expr.childExpression(childName);

      if (!ownSubExpression?.isSubExpression(subExpression)) {
        return false;
      }
    }

    return true;
  }

  // Returns a RelationExpression for a child node or null if there
  // is no child with the given name `childName`.
  childExpression(childName: string) {
    if (
      this.node.$allRecursive ||
      (childName === this.node.$name &&
        this.recursionDepth < this.maxRecursionDepth - 1)
    ) {
      return new RelationExpression(this.node, this.recursionDepth + 1);
    }

    const child = this.node[childName];

    if (child) {
      return new RelationExpression(child);
    } else {
      return;
    }
  }

  // Loops through all first level children.
  forEachChildExpression(
    modelClass: Model,
    cb: (expr: RelationExpression, rel: string) => unknown,
  ) {
    const maxRecursionDepth = this.maxRecursionDepth;

    if (this.node.$allRecursive) {
      for (const relationName of modelClass.getRelationNames()) {
        const node = newNode(relationName, true);
        const relation = modelClass.getRelationUnsafe(relationName);
        const childExpr = new RelationExpression(node);

        cb(childExpr, relation);
      }
    } else if (this.recursionDepth < maxRecursionDepth - 1) {
      const relation = modelClass.getRelationUnsafe(this.node.$relation) ||
        null;
      const childExpr = new RelationExpression(
        this.node,
        this.recursionDepth + 1,
      );

      cb(childExpr, relation);
    } else if (maxRecursionDepth === 0) {
      for (const childName of this.node.$childNames) {
        const node = this.node[childName];
        const relation = modelClass.getRelationUnsafe(node.$relation);

        if (!relation) {
          throw new RelationDoesNotExistError(node.$relation);
        }

        const childExpr = new RelationExpression(node);

        cb(childExpr, relation);
      }
    }
  }

  expressionsAtPath(path: string | RelationExpression | Node) {
    return findExpressionsAtPath(this, RelationExpression.create(path), []);
  }

  clone() {
    return new RelationExpression(cloneNode(this.node), this.recursionDepth);
  }

  toString() {
    return toString(this.node);
  }

  toPojo() {
    return cloneNode(this.node);
  }

  toJSON() {
    return this.toPojo();
  }
}

const parseCache = new Map();
function parse(str: string): Node {
  const cachedNode = parseCache.get(str);

  if (cachedNode) {
    return cloneNode(cachedNode);
  } else {
    const node = parseRelExpr(str);
    parseCache.set(str, cloneNode(node));
    return node;
  }
}

// All enumerable properties of a node that don't start with `$`
// are child nodes.
function getChildNames(node?: Node): string[] {
  if (!node) {
    return [];
  }

  const childNames = [];

  for (const key of Object.keys(node)) {
    if (key[0] !== '$') {
      childNames.push(key);
    }
  }

  return childNames;
}

function toString(node?: Node): string {
  if (!node) {
    return '';
  }

  const childNames = node.$childNames;

  let childExpr: string | string[] = childNames.map((childName) =>
    node[childName]
  ).map(toString);
  let str = node.$relation;

  if (node.$recursive) {
    if (isNumber(node.$recursive)) {
      str += '.^' + node.$recursive;
    } else {
      str += '.^';
    }
  } else if (node.$allRecursive) {
    str += '.*';
  }

  if (childExpr.length > 1) {
    childExpr = `[${childExpr.join(', ')}]`;
  } else {
    childExpr = childExpr[0];
  }

  if (node.$modify.length) {
    str += `(${node.$modify.join(', ')})`;
  }

  if (node.$name !== node.$relation) {
    str += ` as ${node.$name}`;
  }

  if (childExpr) {
    if (str) {
      return `${str}.${childExpr}`;
    } else {
      return childExpr;
    }
  } else {
    return str;
  }
}

function cloneNode(node?: Node): Node {
  return normalizeNode(node);
}

function modelGraphToNode(models: null | Model | Model[], node: Node) {
  if (!models) {
    return;
  }

  if (Array.isArray(models)) {
    for (let i = 0, l = models.length; i < l; ++i) {
      modelToNode(models[i], node);
    }
  } else {
    modelToNode(models, node);
  }

  return node;
}

// update node by reference
// TODO proper typing for model
function modelToNode(model: nany, node: Node) {
  const modelClass = model.constructor;
  const relationNames = modelClass.getRelationNames();

  for (let r = 0, lr = relationNames.length; r < lr; ++r) {
    const relName = relationNames[r];

    if (model[relName] !== undefined) {
      let childNode = node[relName];

      if (!childNode) {
        childNode = newNode(relName);
        node[relName] = childNode;
        node.$childNames.push(relName);
      }

      modelGraphToNode(model[relName], childNode);
    }
  }
}

function newNode(name?: string, allRecusive = false) {
  return normalizeNode(undefined, name, allRecusive);
}

function normalizeNode(
  node?: Node,
  name?: string,
  allRecusive = false,
): Node {
  const normalized: Node = {
    $name: normalizeName(node, name),
    $relation: normalizeRelation(node, name),
    $modify: normalizeModify(node),
    $recursive: normalizeRecursive(node),
    $allRecursive: normalizeAllRecursive(node, allRecusive),
    $childNames: normalizeChildNames(node),
  };

  for (const childName of normalized.$childNames) {
    const childNode = node?.[childName];

    if (isObject(childNode) || childNode === true) {
      (normalized as nany)[childName] = normalizeNode(childNode, childName);
    }
  }

  return normalized;
}

function normalizeName(node?: Node, name?: string): Node['$name'] {
  return node?.$name || name || '';
}

function normalizeRelation(node?: Node, name?: string): Node['$relation'] {
  return node?.$relation || name || '';
}

function normalizeModify(node?: Node): Node['$modify'] {
  if (!node?.$modify) {
    return [];
  }

  return Array.isArray(node.$modify) ? node.$modify.slice() : [node.$modify];
}

function normalizeRecursive(node?: Node): Node['$recursive'] {
  return node?.$recursive ?? false;
}

function normalizeAllRecursive(node?: Node, allRecusive?: boolean): boolean {
  return node?.$allRecursive ?? allRecusive ?? false;
}

function normalizeChildNames(node?: Node) {
  return node?.$childNames?.slice() || getChildNames(node);
}

function findExpressionsAtPath(
  target: RelationExpression,
  path: RelationExpression | undefined,
  results: RelationExpression[],
) {
  if (!path?.node.$childNames.length) {
    // Path leaf reached, add target node to result set.
    results.push(target);
  } else {
    for (const childName of path?.node.$childNames) {
      const pathChild = path.childExpression(childName);
      const targetChild = target.childExpression(childName);

      if (targetChild) {
        findExpressionsAtPath(targetChild, pathChild, results);
      }
    }
  }

  return results;
}

function mergeNodes(node1: Node, node2: Node): Node {
  const node: Node = {
    $name: node1.$name,
    $relation: node1.$relation,
    $modify: union(node1.$modify, node2.$modify),
    $recursive: mergeRecursion(node1.$recursive, node2.$recursive),
    $allRecursive: node1.$allRecursive || node2.$allRecursive,
    $childNames: [],
  };

  if (!node.$recursive && !node.$allRecursive) {
    node.$childNames = union(node1.$childNames, node2.$childNames);

    for (const childName of node.$childNames) {
      const child1 = node1[childName];
      const child2 = node2[childName];

      if (child1 && child2) {
        node[childName] = mergeNodes(child1, child2);
      } else {
        node[childName] = child1 || child2;
      }
    }
  } else {
    node.$childNames = [];
  }

  return node;
}

function mergeRecursion(
  rec1: Node['$recursive'],
  rec2: Node['$recursive'],
): Node['$recursive'] {
  if (rec1 === true || rec2 === true) {
    return true;
  } else if (isNumber(rec1) && isNumber(rec2)) {
    return Math.max(rec1, rec2);
  } else {
    return rec1 || rec2;
  }
}
