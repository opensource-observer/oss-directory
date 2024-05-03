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
  return await tmp.withDir(
    async (t) => {
      const git = simpleGit();
      await git.clone(OSS_DIRECTORY_URL, t.path);
      if (branchOrCommit) {
        await git.cwd(t.path).checkout(branchOrCommit);
      }
      return loadData(t.path);
    },
    { unsafeCleanup: true },
  );
}

/**
 * Loads data from some base path
 *
 * @param basePath The path to load data from
 */
export async function loadData(basePath: string) {
  const projectFiles = await glob(path.resolve(basePath, PROJECTS_GLOB));
  const collectionFiles = await glob(path.resolve(basePath, COLLECTIONS_GLOB));
  try {
    const projects: Project[] = await Promise.all(
      projectFiles.map((f) => readProjectFile(f)),
    );
    const collections: Collection[] = await Promise.all(
      collectionFiles.map((f) => readCollectionFile(f)),
    );
    return { projects, collections };
  } catch (e) {
    const msg =
      "[OSS-DIRECTORY] failed reading from GitHub. Are you sure you have the latest version of the 'oss-directory' package?";
    console.error(msg);
    console.error(e);
    throw new Error(msg);
  }
}
