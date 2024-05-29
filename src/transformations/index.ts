import _ from "lodash";
import { Transformation } from "../types.js";
import { assert } from "../utils/common.js";
import deployersToAnyEvm from "./deployersToAnyEvm.js";

// List of migrations to run
const TRANSFORMATIONS: Transformation[] = [deployersToAnyEvm];
// The highest version number among all migrations
const transformationNames = TRANSFORMATIONS.map((t) => t.name);
// Make sure TRANSFORMATIONS has no duplicates
assert(
  _.uniq(transformationNames).length === transformationNames.length,
  `Found duplicate transformation names: ${transformationNames}`,
);

export { TRANSFORMATIONS };
