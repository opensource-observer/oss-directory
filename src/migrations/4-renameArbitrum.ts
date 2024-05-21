import _ from "lodash";
import { Migration } from "./index.js";

/**
 * This renames `arbitrum` to `arbitrum-one`
 * @param existing
 * @returns
 */
async function renameNetworks(existing: any): Promise<any> {
  // By-pass if no optimism addresses
  if (!existing.blockchain || !Array.isArray(existing.blockchain)) {
    return { ...existing };
  }

  // Change
  // Rename `optimism` to `blockchain` and add the `networks` field
  const newAddresses = existing.blockchain.map((address: any) => ({
    ...address,
    networks: address.networks.map((network: string) =>
      network === "arbitrum" ? "arbitrum-one" : network,
    ),
  }));

  return {
    ..._.omit(existing, ["blockchain"]),
    blockchain: newAddresses,
  };
}

const migration: Migration = {
  version: 4,
  project: {
    up: renameNetworks,
  },
  collection: {
    up: async (existing: any) => existing,
  },
};
export default migration;
