import { glob } from "glob";
import path from "path";
import { simpleGit } from "simple-git";
import tmp from "tmp-promise";
import { Collection } from "./types/collection.js";
import { Project } from "./types/project.js";
import { readProjectFile, readCollectionFile } from "./validator/index.js";

const OSS_DIRECTORY_URL =
  "https://github.com/opensource-observer/oss-directory.git";
const PROJECTS_GLOB = "./data/projects/**/*.yaml";
const COLLECTIONS_GLOB = "./data/collections/*.yaml";

/**
 * Clones the `oss-directory` repo into a temporary directory,
 * reads from the `./data` directory and returns the projects and collections.
 */
export async function fetchData(branchOrCommit?: string) {
  let projects: Project[] = [];
  let collections: Collection[] = [];

  await tmp.withDir(
    async (t) => {
      const git = simpleGit();
      await git.clone(OSS_DIRECTORY_URL, t.path);
      if (branchOrCommit) {
        await git.cwd(t.path).checkout(branchOrCommit);
      }
      const projectFiles = await glob(path.resolve(t.path, PROJECTS_GLOB));
      const collectionFiles = await glob(
        path.resolve(t.path, COLLECTIONS_GLOB),
      );
      projects = await Promise.all(projectFiles.map((f) => readProjectFile(f)));
      collections = await Promise.all(
        collectionFiles.map((f) => readCollectionFile(f)),
      );
    },
    { unsafeCleanup: true },
  );
  //console.log(projects);
  //console.log(collections);
  return { projects, collections };
}
