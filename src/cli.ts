#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  ValidateArgs,
  validateCollections,
  validateProjects,
} from "./actions/validate.js";

yargs(hideBin(process.argv))
  .command<ValidateArgs>(
    "validate-collections",
    "Validates a directory of collections",
    (yags) => {
      yags
        .option("dir", {
          type: "string",
          describe: "Directory to validate",
          default: "./data/collections",
        })
        .option("format", {
          type: "string",
          describe: "Expected file format (e.g. 'json' or 'yaml')",
          default: "yaml",
        });
    },
    (argv) => validateCollections(argv),
  )
  .command<ValidateArgs>(
    "validate-projects",
    "Validates a directory of projects",
    (yags) => {
      yags
        .option("dir", {
          type: "string",
          describe: "Directory to validate",
          default: "./data/projects",
        })
        .option("format", {
          type: "string",
          describe: "Expected file format (e.g. 'json' or 'yaml')",
          default: "yaml",
        });
    },
    (argv) => validateProjects(argv),
  )
  .demandCommand()
  .strict()
  .help("h")
  .alias("h", "help")
  .parse();
