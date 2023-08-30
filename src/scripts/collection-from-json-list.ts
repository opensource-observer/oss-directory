#!/usr/bin/env node

import fs from "fs";
import _ from "lodash";
import { dirname } from "path";
import YAML from "yaml";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getCollectionPath, getProjectPath } from "../utils/format.js";
import { currentVersion } from "../utils/migration.js";

type Project = {
  projectName: string;
  projectGithub: string | string[];
};

type Args = {
  name: string;
  slug: string;
  input: string;
};

yargs(hideBin(process.argv))
  .option("name", {
    type: "string",
    describe: "Name of the new collection",
  })
  .option("slug", {
    type: "string",
    describe: "Slug for the new collection",
  })
  .option("input", {
    type: "string",
    describe: "Path to the input JSON file containing projects",
  })
  .command<Args>(
    "projects",
    "generates project files",
    (yags) => {
      yags;
    },
    (argv) => {
      const jsonStr = fs.readFileSync(argv.input, "utf8");
      const projects: Project[] = JSON.parse(jsonStr);

      projects.forEach((project) => {
        const name = project.projectName;
        const slug = _.kebabCase(name).toLowerCase();
        const outFile = getProjectPath(slug);
        const outDir = dirname(outFile);

        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir);
        }

        const projectData = {
          version: currentVersion,
          slug,
          name,
          github: Array.isArray(project.projectGithub)
            ? project.projectGithub.map((url) => ({ url }))
            : [{ url: project.projectGithub }],
        };

        const yaml = YAML.stringify(projectData);
        fs.writeFileSync(outFile, yaml);
        console.log(`Generated project file for: ${slug}`);
      });
    },
  )
  .command<Args>(
    "collections",
    "generates collection file",
    (yags) => {
      yags;
    },
    (argv) => {
      const jsonStr = fs.readFileSync(argv.input, "utf8");
      const projects: Project[] = JSON.parse(jsonStr);
      const { name, slug } = argv;

      const collection = {
        version: currentVersion,
        slug,
        name,
        projects: projects
          .map((p) => _.kebabCase(p.projectName).toLowerCase())
          .sort(),
      };

      const yaml = YAML.stringify(collection);
      const outFile = getCollectionPath(slug);
      fs.writeFileSync(outFile, yaml);
      console.log(`Generated collection file for: ${slug}`);
    },
  )
  .demandCommand()
  .demandOption(["name", "slug", "input"])
  .strict()
  .help("h")
  .alias("h", "help")
  .parse();
