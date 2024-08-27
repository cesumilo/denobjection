class A {
  static returnMessage(): string {
    return 'Hello A';
  }

  sayHello() {
    console.log((this.constructor as typeof A).returnMessage());
  }
}

class B extends A {
  static override returnMessage(): string {
    return 'Hello B';
  }
}


new B().sayHello(); // Hello B