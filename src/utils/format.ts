import path from "path";
import _ from "lodash";
import { Project } from "../types/project.js";
import { safeCastProject } from "../validator/index.js";

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

function orderProjectFields(p: Project): Project {
  const ordered = {
    version: p.version,
    name: p.name,
    display_name: p.display_name,
    description: p.description,
    websites: p.websites,
    social: p.social,
    github: p.github,
    npm: p.npm,
    blockchain: p.blockchain,
  };
  return {
    ...ordered,
    ..._.omit(p, Object.keys(ordered)),
  };
}

/**
 * This will take 2 Project files and merge them
 * - The `src` will overwrite literals in the `dst`
 * - Arrays and objects will be recursively merged
 * - This will also de-duplicate identical objects in an array
 * - This will throw an exception if the result is not a `Project`
 * @param dst
 * @param src
 */
function mergeProjects(dst: any, src: any): Project {
  // The customizer will try to deduplicate elements in an array
  const mergeCustomizer = (obj: any, src: any) => {
    if (_.isArray(obj)) {
      const newArray = obj.concat(src);
      return _.uniqWith(newArray, _.isEqual);
    }
  };
  const merged = _.mergeWith(dst, src, mergeCustomizer);
  const project = safeCastProject(merged);
  return project;
}

export { getCollectionPath, getProjectPath, mergeProjects, orderProjectFields };
