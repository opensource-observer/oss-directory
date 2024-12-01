import { Transformation } from "../types.js";

/**
 * Convert all blockchain addresses to lowercase
 * @param existing
 * @returns
 */
async function updateProjects(existing: any): Promise<any> {
  if (!existing.blockchain && !existing.github) {
    return existing;
  }

  // Helper function to standardize URLs
  const standardizeUrl = (url: string) => url.toLowerCase().replace(/\/+$/, "");

  // Process GitHub URLs
  if (existing.github) {
    existing.github = existing.github.map((x: any) => ({
      ...x,
      url: standardizeUrl(x.url),
    }));
  }

  // Process blockchain addresses
  return {
    ...existing,
    blockchain: existing.blockchain?.map((x: any) => ({
      ...x,
      address: x.address.toLowerCase(),
    })),
  };
}

const transformation: Transformation = {
  name: "convertToLower",
  collection: {
    up: async (existing: any) => existing, // No change for collections
  },
  project: {
    up: updateProjects,
  },
};
export default transformation;
