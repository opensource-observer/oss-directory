#!/usr/bin/env node

import fs from "fs";
import _ from "lodash";
import { dirname } from "path";
import YAML from "yaml";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { safeCastProject, safeCastCollection } from "../index.js";
import { getCollectionPath, getProjectPath } from "../utils/format.js";
import { currentVersion } from "../utils/migration.js";

type Args = {
  in: string;
};

/**
 * Converts the optimism json file to a directory of project and collection files
 */
yargs(hideBin(process.argv))
  .option("in", {
    type: "string",
    describe: "Input file",
  })
  .command<Args>(
    "projects",
    "generates project files",
    (yags) => {
      yags;
    },
    (argv) => {
      const jsonStr = fs.readFileSync(argv.in, "utf8");
      const json = JSON.parse(jsonStr);

      for (const [key, value] of Object.entries(json)) {
        const v = value as any;
        const name = key;
        const slug = _.kebabCase(name).toLowerCase();
        const outFile = getProjectPath(slug);
        const outDir = dirname(outFile);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir);
        }
        const project = safeCastProject({
          version: currentVersion,
          slug,
          name,
          github: [{ url: v.github }],
          optimism: [
            ...(v["creator_addresses"] ?? []).map((addr: string) => ({
              address: addr,
              type: "creator",
            })),
            ...(v["factory_contracts"] ?? []).map((addr: string) => ({
              address: addr,
              type: "factory",
            })),
            ...(v["standalone_contracts"] ?? []).map((addr: string) => ({
              address: addr,
              type: "contract",
            })),
          ],
        });
        const yaml = YAML.stringify(project);
        fs.writeFileSync(outFile, yaml);
        console.log(slug);
      }
    },
  )
  .command<Args>(
    "collections",
    "generates collection file",
    (yags) => {
      yags;
    },
    (argv) => {
      const jsonStr = fs.readFileSync(argv.in, "utf8");
      const json = JSON.parse(jsonStr);
      const slug = "optimism";
      const name = "Optimism";
      const collection = safeCastCollection({
        version: currentVersion,
        slug,
        name,
        projects: _.keys(json).map(_.kebabCase).sort(),
      });
      const yaml = YAML.stringify(collection);
      const outFile = getCollectionPath(slug);
      fs.writeFileSync(outFile, yaml);
    },
  )
  .demandCommand()
  .demandOption(["in"])
  .strict()
  .help("h")
  .alias("h", "help")
  .parse();
