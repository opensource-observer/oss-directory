import { Transformation } from "../types.js";

// `network` => integer
const COUNT: Record<string, number> = {};
const increment = (network: string) => {
  if (!COUNT[network]) {
    COUNT[network] = 0;
  }
  COUNT[network]++;
};

/**
 * Don't actually do any transformations.
 * Just count the number of artifacts per network
 * @param existing
 * @returns
 */
async function updateProjects(existing: any): Promise<any> {
  if (!existing.blockchain) {
    return existing;
  }

  existing.blockchain.forEach((x: any) => {
    x.networks.forEach(increment);
  });

  console.log(COUNT);
  return existing;
}

const transformation: Transformation = {
  name: "countNetworks",
  collection: {
    up: async (existing: any) => existing, // No change for collections
  },
  project: {
    up: updateProjects,
  },
};
export default transformation;
