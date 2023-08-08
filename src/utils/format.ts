import path from "path";

const DEFAULT_BASE_DIRECTORY = "./data/";
const DEFAULT_PROJECT_DIRECTORY = "./projects/";
const DEFAULT_COLLECTION_DIRECTORY = "./collections/";
const DEFAULT_EXTENSION = ".yaml";

type PathOptions = {
  baseDir?: string;
  projectDir?: string;
  collectionDir?: string;
  extension?: string;
};

const getPathOptions = (opts?: PathOptions): Required<PathOptions> => ({
  baseDir: opts?.baseDir ?? DEFAULT_BASE_DIRECTORY,
  projectDir: opts?.projectDir ?? DEFAULT_PROJECT_DIRECTORY,
  collectionDir: opts?.collectionDir ?? DEFAULT_COLLECTION_DIRECTORY,
  extension: opts?.extension ?? DEFAULT_EXTENSION,
});

/**
 * Given a collection slug, return the relative path to the collection file
 * @param slug
 * @returns
 */
function getCollectionPath(slug: string, opts?: PathOptions) {
  const { baseDir, collectionDir, extension } = getPathOptions(opts);
  const dir = path.join(baseDir, collectionDir);
  return path.format({
    root: dir,
    name: slug,
    ext: extension,
  });
}

/**
 * Given a project slug, return the relative path to the project file
 * @param slug
 * @returns
 */
function getProjectPath(slug: string, opts?: PathOptions) {
  const { baseDir, projectDir, extension } = getPathOptions(opts);
  const firstChar = `./${slug.charAt(0)}/`;
  const dir = path.join(baseDir, projectDir, firstChar);
  return path.format({
    root: dir,
    name: slug,
    ext: extension,
  });
}

export { getCollectionPath, getProjectPath };
