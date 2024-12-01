import { Transformation } from "../types.js";

/**
 * Sort projects alphabetically and remove duplicates in collections
 */
async function updateCollection(existing: any): Promise<any> {
  if (!existing.projects) {
    return existing;
  }

  return {
    ...existing,
    projects: [...new Set(existing.projects)].sort(),
  };
}

const transformation: Transformation = {
  name: "sortCollection",
  collection: {
    up: updateCollection,
  },
  project: {
    up: async (existing: any) => existing, // No change for projects
  },
};

export default transformation;
