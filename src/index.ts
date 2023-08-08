import { Project } from "./types/project.js";
import { Collection } from "./types/collection.js";
export { Project, Collection };

import {
  validateProject,
  validateCollection,
  safeCastProject,
  safeCastCollection,
  readProjectFile,
  readCollectionFile,
} from "./validator/index.js";
export {
  validateProject,
  validateCollection,
  safeCastProject,
  safeCastCollection,
  readProjectFile,
  readCollectionFile,
};

import { fetchData } from "./fetchData.js";
export { fetchData };
