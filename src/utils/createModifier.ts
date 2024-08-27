import { nany } from '../ninja.ts';
import { asArray, isFunction, isPlainObject, isString } from './object.ts';

export function createModifier(
  { modelClass, modifier, modifiers }: {
    modelClass: nany;
    modifier: nany;
    modifiers: nany;
  },
) {
  const modelModifiers = modelClass ? modelClass.getModifiers() : {};

  const modifierFunctions = asArray(modifier).map((modifier) => {
    let modify = null;

    if (isString(modifier)) {
      modify = (modifiers && modifiers[modifier]) || modelModifiers[modifier];

      // Modifiers can be pointers to other modifiers. Call this function recursively.
      if (modify && !isFunction(modify)) {
        return createModifier({ modelClass, modifier: modify, modifiers });
      }
    } else if (isFunction(modifier)) {
      modify = modifier;
    } else if (isPlainObject(modifier)) {
      modify = (builder: nany) => builder.where(modifier);
    } else if (Array.isArray(modifier)) {
      return createModifier({ modelClass, modifier, modifiers });
    }

    if (!modify) {
      modify = (builder: nany) =>
        modelClass.modifierNotFound(builder, modifier);
    }

    return modify;
  });

  return (builder: nany, ...args: nany[]) => {
    for (const modifier of modifierFunctions) {
      modifier.call(builder, builder, ...args);
    }
  };
}
