/**
 * Migration for a single schema
 */
type SingleMigration = {
  up: (existing: any) => Promise<any>;
};

/**
 * Completely specified migration
 * Migrations are associated with a schema change,
 * so files must be versioned
 */
type Migration = {
  version: number;
  collection: SingleMigration;
  project: SingleMigration;
};

/**
 * Completely specified transformation
 * Transformations are *not* associated with a schema change,
 * so we don't stamp any new version number.
 */
type Transformation = {
  name: string;
  collection: SingleMigration;
  project: SingleMigration;
};

const createNoopSingleMigration = () => ({
  up: async (existing: any) => existing,
});

const createNoopMigration = (version: number): Migration => ({
  version,
  collection: createNoopSingleMigration(),
  project: createNoopSingleMigration(),
});

const createNoopTransformation = (name: string): Transformation => ({
  name,
  collection: createNoopSingleMigration(),
  project: createNoopSingleMigration(),
});

export {
  SingleMigration,
  Migration,
  Transformation,
  createNoopMigration,
  createNoopTransformation,
};
