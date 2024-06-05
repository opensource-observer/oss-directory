import { writeFile } from "fs/promises";
import path from "path";
import _ from "lodash";
import { glob } from "glob";
import { Migration, SingleMigration } from "../types.js";
import { MIGRATIONS } from "../migrations/index.js";
import { CommonArgs } from "../types/cli.js";
import { FileFormat, getFileExtension, getFileFormat } from "../types/files.js";
import { safeCastCollection, safeCastProject } from "../validator/index.js";
import { NullOrUndefinedValueError } from "../utils/error.js";
import { readFileParse, stringify } from "../utils/files.js";

export type MigrationArgs = CommonArgs & {
  collectionsDir: string;
  projectsDir: string;
};

/**
 * Generic migration logic
 * @param args
 */
async function migrate(
  directory: string,
  fileFormat: FileFormat,
  getSingleMigration: (m: Migration) => SingleMigration,
  validateStringify: (obj: any) => string,
) {
  const extension = getFileExtension(fileFormat);
  const files = await glob(path.resolve(directory, `**/*${extension}`));
  let count = 0;
  console.log(`Migrating files in ${directory}`);
  for (const file of files) {
    let obj = await readFileParse(file, fileFormat);
    if (!obj?.version) {
      throw new NullOrUndefinedValueError(`version missing from ${file}`);
    }

    // Look for applicable migrations
    const greaterVersions = _.filter(
      MIGRATIONS,
      (m) => m.version > obj.version,
    );

    // Skip if no migrations to run
    if (greaterVersions.length <= 0) {
      continue;
    } else {
      count++;
    }

    for (const migration of greaterVersions) {
      console.log(`Migrating ${file} to version ${migration.version}`);
      // Do the migration
      const inputObj = _.cloneDeep(obj);
      obj = await getSingleMigration(migration).up(inputObj);
      // Stamp the version
      obj.version = migration.version;
    }
    // Write back to disk after done migrating
    const objStr = validateStringify(obj);
    await writeFile(file, objStr, { encoding: "utf-8" });
  }
  console.log(`Success! Migrated ${count} files`);
}

/**
 * Migrate all files in a projects directory
 * @param args
 */
async function migrateProjects(args: MigrationArgs) {
  const fileFormat = getFileFormat(args.format);
  await migrate(
    args.projectsDir,
    fileFormat,
    (x) => x.project,
    (obj: any) => {
      const p = safeCastProject(obj);
      return stringify(p, fileFormat);
    },
  );
}

/**
 * Migrate all files in a collections directory
 * @param args
 */
async function migrateCollections(args: MigrationArgs) {
  const fileFormat = getFileFormat(args.format);
  await migrate(
    args.collectionsDir,
    fileFormat,
    (x) => x.collection,
    (obj: any) => {
      const c = safeCastCollection(obj);
      return stringify(c, fileFormat);
    },
  );
}

/**
 * This the action that gets exposed to the CLI
 * @param args
 */
async function runMigrations(args: MigrationArgs) {
  await migrateCollections(args);
  await migrateProjects(args);
}

export { runMigrations };
