import { Class } from './src/types/Class.ts';
import { enumerableProperty } from './src/utils/decorators/enumerable.ts';

class A {
  @enumerableProperty(false)
  static isAConstructor = true;
}

class B {}

class C extends A {}

function isClass<T extends A>(value: any, a: Class<T>): value is T {
  return value instanceof a;
}

console.log(isClass(new C(), A));
console.log(isClass(new A(), A));
console.log(isClass(new B(), A));

const operationSelector = A;
console.log("isAConstructor" in operationSelector);
const test = A
console.log(A.propertyIsEnumerable("isAConstructor"));