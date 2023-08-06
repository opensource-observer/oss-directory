#!/usr/bin/env node

import fs from "fs";
import path from "path";
import _ from "lodash";
import YAML from "yaml";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { safeCastProject, safeCastCollection } from "../index.js";

type Args = {
  in: string;
  out: string;
};

/**
 * Converts the optimism json file to a directory of project and collection files
 */
yargs(hideBin(process.argv))
  .option("in", {
    type: "string",
    describe: "Input file",
  })
  .option("out", {
    type: "string",
    describe: "Output",
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

      if (!fs.lstatSync(argv.out).isDirectory()) {
        throw new Error("Output must be a directory");
      }

      for (const [key, value] of Object.entries(json)) {
        const v = value as any;
        const name = key;
        const slug = _.kebabCase(name).toLowerCase();
        const firstChar = slug.charAt(0);
        const dir = path.resolve(argv.out, firstChar);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        const project = safeCastProject({
          name,
          slug,
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
        fs.writeFileSync(path.resolve(dir, `${slug}.yaml`), yaml);
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
      const collection = safeCastCollection({
        projects: _.keys(json).map(_.kebabCase).sort(),
      });
      const yaml = YAML.stringify(collection);
      fs.writeFileSync(argv.out, yaml);
    },
  )
  .demandCommand()
  .demandOption(["in", "out"])
  .strict()
  .help("h")
  .alias("h", "help")
  .parse();
