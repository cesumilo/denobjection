/**
 * Decorator that sets the enumerable property of a class method or property descriptor.
 * @param value - A boolean value indicating whether the property should be enumerable or not.
 * @returns A decorator function that sets the enumerable property of the target property.
 */
export function enumerable(
  value: boolean,
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    descriptor.enumerable = value;
  };
}
