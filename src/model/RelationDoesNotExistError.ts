export class RelationDoesNotExistError extends Error {
  readonly relationName: string;

  constructor(relationName: string) {
    super(`unknown relation "${relationName}" in a relation expression`);

    this.name = this.constructor.name;
    this.relationName = relationName;
  }
}
