import _ from "lodash";
import { Migration } from "./index.js";

/**
 * This does not change the schema. It just looks for duplicate optimism addresses
 * and removes them according to a priority order
 * @param existing
 * @returns
 */
async function blockchainAddressTypeToTags(existing: any): Promise<any> {
  // By-pass if no optimism addresses
  if (!existing.optimism || !Array.isArray(existing.optimism)) {
    return { ...existing };
  }

  // De-duplicate
  const grouped = _.groupBy(existing.optimism, (x) => x.address);
  const collapsed = _.mapValues(grouped, (arr) => ({
    address: arr[0].address,
    name: arr[0].name,
    tags: arr.map((x) => x.type),
  }));
  return {
    ...existing,
    optimism: _.values(collapsed),
  };
}

const migration: Migration = {
  version: 2,
  project: {
    up: blockchainAddressTypeToTags,
  },
  collection: {
    up: async (existing: any) => existing,
  },
};
export default migration;
