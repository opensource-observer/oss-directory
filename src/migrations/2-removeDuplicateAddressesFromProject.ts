import _ from "lodash";
import { safeCastProject } from "../validator/index.js";
import { assertNever } from "../utils/common.js";
import { Migration } from "./index.js";

/**
 * This does not change the schema. It just looks for duplicate optimism addresses
 * and removes them according to a priority order
 * @param existing
 * @returns
 */
async function removeDuplicateAddressesFromProject(
  existing: any,
): Promise<any> {
  // We aren't changing the schema, just deduplicating data
  const project = safeCastProject(existing);

  // By-pass if no optimism addresses
  if (!project.optimism) {
    return { ...existing };
  }

  // De-duplicate
  const grouped = _.groupBy(project.optimism, (x) => x.address);
  const choseOne = _.mapValues(
    grouped,
    (arr) =>
      _.sortBy(
        arr,
        (x) =>
          // Highest priority to types with more specificity
          x.type === "creator"
            ? 1
            : x.type === "factory"
            ? 2
            : x.type === "safe"
            ? 3
            : x.type === "eoa"
            ? 5
            : x.type === "contract"
            ? 6
            : assertNever(x.type),
        // Get the highest priority item
      )[0],
  );
  const deduped = _.values(choseOne);
  return {
    ...existing,
    optimism: deduped,
  };
}

const migration: Migration = {
  version: 2,
  project: {
    up: removeDuplicateAddressesFromProject,
  },
  collection: {
    up: async (existing: any) => existing,
  },
};
export default migration;
