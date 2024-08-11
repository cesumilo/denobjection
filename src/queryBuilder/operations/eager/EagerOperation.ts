import { QueryBuilderOperation } from '../QueryBuilderOperation.ts';
import { RelationExpression } from '../../RelationExpression.js';
import { nany } from '../../../ninja.ts';

export class EagerOperation extends QueryBuilderOperation {
  private expression: RelationExpression;
  private modifiersAtPath: nany[];
  graphOptions: nany;

  constructor(name: string, opt: nany) {
    super(name, opt);

    this.expression = RelationExpression.create();
    this.modifiersAtPath = [];
    this.graphOptions = this.opt.defaultGraphOptions;
  }

  buildFinalExpression() {
    const expression = this.expression.clone();

    this.modifiersAtPath.forEach((modifier, i) => {
      const modifierName = getModifierName(i);

      expression.expressionsAtPath(modifier.path).forEach(
        (expr: RelationExpression) => {
          expr.node.$modify.push(modifierName);
        },
      );
    });

    return expression;
  }

  buildFinalModifiers(builder: nany) {
    // `modifiers()` returns a clone so we can modify it.
    const modifiers = builder.modifiers();

    this.modifiersAtPath.forEach((modifier, i) => {
      const modifierName = getModifierName(i);

      modifiers[modifierName] = modifier.modifier;
    });

    return modifiers;
  }

  override cloneInto(clone: QueryBuilderOperation): QueryBuilderOperation {
    super.cloneInto(clone);

    const eagerClone = clone as EagerOperation;
    eagerClone.expression = this.expression.clone();
    eagerClone.modifiersAtPath = this.modifiersAtPath.slice();
    eagerClone.graphOptions = Object.assign({}, this.graphOptions);

    return clone;
  }

  override clone(): EagerOperation {
    return this.cloneInto(
      new EagerOperation(this.name, this.opt),
    ) as EagerOperation;
  }
}

function getModifierName(index: nany) {
  return `_f${index}_`;
}
