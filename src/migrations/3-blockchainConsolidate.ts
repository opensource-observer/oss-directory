import _ from "lodash";
import { Migration } from "../types.js";

/**
 * This does not change the schema. It just looks for duplicate optimism addresses
 * and removes them according to a priority order
 * @param existing
 * @returns
 */
async function blockchainConsolidate(existing: any): Promise<any> {
  // By-pass if no optimism addresses
  if (!existing.optimism || !Array.isArray(existing.optimism)) {
    return { ...existing };
  }

  // Rename `optimism` to `blockchain` and add the `networks` field
  const newAddresses = existing.optimism.map((x: any) => ({
    ...x,
    networks: ["optimism"],
  }));

  return {
    ..._.omit(existing, ["optimism"]),
    blockchain: newAddresses,
  };
}

const migration: Migration = {
  version: 3,
  project: {
    up: blockchainConsolidate,
  },
  collection: {
    up: async (existing: any) => existing,
  },
};
export default migration;
