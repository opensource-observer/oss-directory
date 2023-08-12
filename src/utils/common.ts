import { AssertionError, NullOrUndefinedValueError } from "./error.js";

/**
 * Asserts that a condition is true.
 * @param cond
 * @param msg
 */
export function assert<T>(cond: T, msg: string): asserts cond {
  if (!cond) {
    // eslint-disable-next-line no-debugger
    debugger;
    throw new AssertionError(msg || "Assertion failed");
  }
}

/**
 * Asserts that a branch is never taken.
 * Useful for exhaustiveness checking.
 * @param _x
 */
export function assertNever(_x: never): never {
  throw new Error("unexpected branch taken");
}

/**
 * Asserts that a value is not null or undefined.
 * @param x
 * @param msg
 * @returns
 */
export function ensure<T>(x: T | null | undefined, msg: string): T {
  if (x === null || x === undefined) {
    // eslint-disable-next-line no-debugger
    debugger;
    throw new NullOrUndefinedValueError(
      `Value must not be undefined or null${msg ? `- ${msg}` : ""}`,
    );
  } else {
    return x;
  }
}
