type Constructor = new (...args: any[]) => {};

/**
 * Apply mixins to a class
 * @see https://www.typescriptlang.org/docs/handbook/mixins.html
 */
export function applyMixins(derivedCtor: Constructor, constructors: Constructor[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ??
          Object.create(null),
      );
    });
  });
}
