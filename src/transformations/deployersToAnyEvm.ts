import { Transformation } from "../types.js";

/**
 * Change all deployers to any_evm
 * @param existing
 * @returns
 */
async function updateProjects(existing: any): Promise<any> {
  if (!existing.blockchain) {
    return existing;
  }
  return {
    ...existing,
    blockchain: existing.blockchain.map((x: any) => {
      if (!x.tags.includes("deployer")) {
        return x;
      }
      return {
        ...x,
        networks: ["any_evm"],
      };
    }),
  };
}

const transformation: Transformation = {
  name: "deployersToAnyEvm",
  collection: {
    up: async (existing: any) => existing, // No change for collections
  },
  project: {
    up: updateProjects,
  },
};
export default transformation;
