const LOGGED_DEPRECATIONS = new Set<string>();

/**
 * Marks a method or property as deprecated and logs a deprecation warning message.
 * @param reason - The reason for deprecating the method or property.
 */
export function deprecate(reason?: string) {
  return function (
    // deno-lint-ignore no-explicit-any
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    const message =
      `${target.constructor.name}.${propertyKey} is deprecated. ${reason}`;
    // Only log deprecation messages once.
    if (!LOGGED_DEPRECATIONS.has(message)) {
      LOGGED_DEPRECATIONS.add(message);
      console.warn(message);
    }
  };
}
