#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  ValidateArgs,
  validateCollections,
  validateProjects,
} from "./actions/validate.js";
import { MigrationArgs, runMigrations } from "./actions/migrate.js";
import { TransformationArgs, runTransformation } from "./actions/transform.js";

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
    "run-migrations",
    "Runs a migration",
    (yags) => {
      yags
        .option("collectionsDir", {
          type: "string",
          describe: "Collections directory to migrate",
          default: "./data/collections",
        })
        .option("projectsDir", {
          type: "string",
          describe: "Projects directory to migrate",
          default: "./data/projects",
        });
    },
    (argv) => runMigrations(argv),
  )
  .command<TransformationArgs>(
    "run-transformation",
    "Runs a transformation",
    (yags) => {
      yags
        .option("collectionsDir", {
          type: "string",
          describe: "Collections directory to migrate",
          default: "./data/collections",
        })
        .option("projectsDir", {
          type: "string",
          describe: "Projects directory to migrate",
          default: "./data/projects",
        })
        .option("name", {
          type: "string",
          describe: "Name of the transformation",
        })
        .demandOption(["name"]);
    },
    (argv) => runTransformation(argv),
  )
  .demandCommand()
  .strict()
  .help("h")
  .alias("h", "help")
  .parse();
