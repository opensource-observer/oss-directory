import _ from "lodash";
import { assert } from "../utils/common.js";
import blockchainAddressTypeToTags from "./2-blockchainAddressTypeToTags.js";
import blockchainConsolidate from "./3-blockchainConsolidate.js";
import renameArbitrum from "./4-renameArbitrum.js";
import schemav1 from "./5-schemav1.js";
import addSocial from "./6-addSocial.js";
import snakecaseNetworks from "./7-snakecaseNetworks.js";

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
  renameArbitrum,
  schemav1,
  addSocial,
  snakecaseNetworks,
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
