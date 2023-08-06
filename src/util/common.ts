
import { AssertionError } from "./error.js";

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
