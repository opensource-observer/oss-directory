import _ from "lodash";
import { assert } from "../utils/common.js";
import blockchainAddressTypeToTags from "./2-blockchainAddressTypeToTags.js";
import blockchainConsolidate from "./3-blockchainConsolidate.js";

/**
 * Migration for a single schema
 */
type SingleMigration = {
  up: (existing: any) => Promise<any>;
};

/**
 * Completely specified migration
 */
type Migration = {
  version: number;
  collection: SingleMigration;
  project: SingleMigration;
};

const createNoopSingleMigration = () => ({
  up: async (existing: any) => existing,
});

const createNoopMigration = (version: number) => ({
  version,
  collection: createNoopSingleMigration(),
  project: createNoopSingleMigration(),
});

// List of migrations to run
const MIGRATIONS: Migration[] = [
  createNoopMigration(1),
  blockchainAddressTypeToTags,
  blockchainConsolidate,
];
// The highest version number among all migrations
const currentVersion = Math.max(...MIGRATIONS.map((m) => m.version));
const migrationVersions = MIGRATIONS.map((m) => m.version);
// Make sure MIGRATIONS is sorted and has no duplicates
assert(
  _.uniq(migrationVersions).length === migrationVersions.length,
  `Found duplicate migration versions: ${migrationVersions}`,
);
assert(
  _.isEqual(
    _.sortBy(migrationVersions, (x) => x),
    migrationVersions,
  ),
  `Migration versions are not sorted: ${migrationVersions}`,
);

export { SingleMigration, Migration, MIGRATIONS, currentVersion };
