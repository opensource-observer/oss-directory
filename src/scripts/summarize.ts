import fs from "fs";
import path from "path";
import { parse } from "yaml";

const walk = (
  dir: string,
  done: (err: Error | null, results?: string[]) => void,
  filter?: (f: string) => boolean,
): void => {
  let results: string[] = [];
  fs.readdir(dir, { withFileTypes: true }, (err: Error | null, list: any[]) => {
    if (err) return done(err);

    let pending = list.length;
    if (!pending) return done(null, results);

    list.forEach((file) => {
      const filePath = path.resolve(dir, file.name);
      if (file.isDirectory()) {
        walk(
          filePath,
          (err, res) => {
            if (res) results = results.concat(res);
            if (!--pending) done(null, results);
          },
          filter,
        );
      } else {
        if (!filter || filter(filePath)) results.push(filePath);
        if (!--pending) done(null, results);
      }
    });
  });
};

const processFiles = (err: Error | null, files?: string[]) => {
  if (err) throw err;

  if (files) {
    const markdownRows = [
      "| Project | Github Repos | Blockchain Addresses |",
      "|-|-|-|",
    ];
    const tally = {
      projects: 0,
      githubRepos: 0,
      blockchainAddresses: 0,
    };

    for (const file of files.sort()) {
      const content = fs.readFileSync(file, "utf8");
      const data = parse(content);

      const githubRepos = (data.github || []).length;
      const blockchainAddresses = (data.optimism || []).length;

      tally.projects++;
      tally.githubRepos += githubRepos;
      tally.blockchainAddresses += blockchainAddresses;

      const projectName = path.basename(file, ".yaml");
      const relativePath = path.relative(".", file);
      markdownRows.push(
        `| [${
          data.name || projectName
        }](https://github.com/hypercerts-org/oss-directory/tree/main/${relativePath.replace(
          /\\/g,
          "/",
        )}) | ${githubRepos} | ${blockchainAddresses} |`,
      );
    }

    fs.writeFileSync("./data/projects/readme.md", markdownRows.join("\n"));
    console.log("Markdown table generated in projects.md");
    console.log("Tally:", tally);
  }
};

walk("./data/projects", processFiles, (f: string) => /.yaml$/.test(f));
