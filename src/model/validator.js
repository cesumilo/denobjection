export class Validator {
  constructor(...args: unknown[]) {
    Validator.init(this, ...args);
  }

  static init(..._args: unknown[]) {}

  beforeValidate({ model, json, options }) {
    model.$beforeValidate(null, json, options);
  }

  validate() {
    /* istanbul ignore next */
    throw new Error("not implemented");
  }

  afterValidate({ model, json, options }) {
    model.$afterValidate(json, options);
  }
}
