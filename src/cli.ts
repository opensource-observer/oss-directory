#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  ValidateArgs,
  validateCollections,
  validateProjects,
} from "./actions/validate.js";
import {
  MigrationArgs,
  migrateProjects,
  migrateCollections,
} from "./actions/migrate.js";

yargs(hideBin(process.argv))
  .option("format", {
    type: "string",
    describe: "Expected file format (e.g. 'json' or 'yaml')",
    default: "yaml",
  })
  .command<ValidateArgs>(
    "validate-collections",
    "Validates a directory of collections",
    (yags) => {
      yags.option("dir", {
        type: "string",
        describe: "Directory to validate",
        default: "./data/collections",
      });
    },
    (argv) => validateCollections(argv),
  )
  .command<ValidateArgs>(
    "validate-projects",
    "Validates a directory of projects",
    (yags) => {
      yags.option("dir", {
        type: "string",
        describe: "Directory to validate",
        default: "./data/projects",
      });
    },
    (argv) => validateProjects(argv),
  )
  .command<MigrationArgs>(
    "migrate-collections",
    "Migrates a directory of collections",
    (yags) => {
      yags.option("dir", {
        type: "string",
        describe: "Directory to migrate",
        default: "./data/collections",
      });
    },
    (argv) => migrateCollections(argv),
  )
  .command<MigrationArgs>(
    "migrate-projects",
    "Migrates a directory of projects",
    (yags) => {
      yags.option("dir", {
        type: "string",
        describe: "Directory to migrate",
        default: "./data/projects",
      });
    },
    (argv) => migrateProjects(argv),
  )
  .demandCommand()
  .strict()
  .help("h")
  .alias("h", "help")
  .parse();
