import _ from "lodash";
import { Migration } from "./index.js";

/**
 * Rename fields
 * - `slug` => `name`
 * - `name` => `display_name`
 * @param existing
 * @returns
 */
async function updateCollections(existing: any): Promise<any> {
  return {
    version: existing.version,
    name: existing.slug,
    display_name: existing.name,
    ..._.omit(existing, ["version", "slug", "name"]),
  };
}

/**
 * This renames `arbitrum` to `arbitrum-one`
 * @param existing
 * @returns
 */
async function updateProjects(existing: any): Promise<any> {
  return {
    version: existing.version,
    name: existing.slug,
    display_name: existing.name,
    ..._.omit(existing, ["version", "slug", "name"]),
  };
}

const migration: Migration = {
  version: 5,
  collection: {
    up: updateCollections,
  },
  project: {
    up: updateProjects,
  },
};
export default migration;
