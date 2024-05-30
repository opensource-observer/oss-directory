import _ from "lodash";
import { Migration } from "../types.js";

/**
 * Snakecase all networks
 * @param existing
 * @returns
 */
async function updateProjects(existing: any): Promise<any> {
  if (!existing.blockchain) {
    return existing;
  }
  return {
    ...existing,
    blockchain: existing.blockchain.map((x: any) => ({
      ...x,
      networks: x.networks.map(_.snakeCase),
    })),
  };
}

const migration: Migration = {
  version: 7,
  collection: {
    up: async (existing: any) => existing, // No change for collections
  },
  project: {
    up: updateProjects,
  },
};
export default migration;
