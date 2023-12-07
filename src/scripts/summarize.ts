import fs from "fs";
import path from "path";
import { parse } from "yaml";

interface ProjectData {
  version: number;
  slug: string;
  name: string;
  github: { url: string }[];
  npm: { url: string }[];
  blockchain: {
    address: string;
    name?: string;
    tags: string[];
    networks: string[];
  }[];
}

const walk = (
  dir: string,
  done: (err: Error | null, results?: string[]) => void,
  filter?: (f: string) => boolean,
): void => {
  let results: string[] = [];
  fs.readdir(
    dir,
    { withFileTypes: true },
    (err: Error | null, list: fs.Dirent[]) => {
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
    },
  );
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
      const data: ProjectData = parse(content);

      const githubRepos = data.github.length;
      const blockchainAddresses = data.blockchain ? data.blockchain.length : 0;

      tally.projects++;
      tally.githubRepos += githubRepos;
      tally.blockchainAddresses += blockchainAddresses;

      const projectName = data.name.replace(/\|/g, "&#124;"); // Replace '|' with '&#124;'
      const relativePath = path.relative(".", file);
      const githubLink = `https://github.com/opensource-observer/oss-directory/tree/main/${relativePath.replace(
        /\\/g,
        "/",
      )}`;
      markdownRows.push(
        `| [${projectName}](${githubLink}) | ${githubRepos} | ${blockchainAddresses} |`,
      );
    }

    // Create a header with summary statistics
    const summaryHeader = `# Project Summary\n\n`;
    const summaryStats = `Total Projects: ${tally.projects}\n\nTotal GitHub Orgs/Owners: ${tally.githubRepos}\n\nTotal Blockchain Addresses: ${tally.blockchainAddresses}\n\n`;

    fs.writeFileSync(
      "./data/projects/readme.md",
      summaryHeader + summaryStats + markdownRows.join("\n"),
    );
    console.log("Markdown table generated in projects.md");
    console.log("Tally:", tally);
  }
};

walk("./data/projects", processFiles, (f: string) => /.yaml$/.test(f));
