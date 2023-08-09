/**
 * Migration for the file schema
 */
type Migration = {
  version: number;
  up: () => Promise<void>;
};

/**
 * List of migrations to run
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: async () => {},
  },
];

// The highest version number among all migrations
const currentVersion = Math.max(...MIGRATIONS.map((m) => m.version));

export { currentVersion };
