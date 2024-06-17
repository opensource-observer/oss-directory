import { readFile, writeFile } from "fs/promises";
import { mkdirp } from "mkdirp";
import path from "path";
import YAML from "yaml";
import { assertNever } from "../utils/common.js";
import { FileFormat } from "../types/files.js";
import { Project } from "../types/project.js";
import { getProjectPath } from "./format.js";

/**
 * Generic function to read and parse a file according to a FileFormat
 * @param filename
 * @param format
 * @returns
 */
async function readFileParse(filename: string, format: FileFormat) {
  const fileContents = await readFile(filename, { encoding: "utf-8" });
  let obj;

  // Parse JSON
  if (format === "JSON") {
    obj = JSON.parse(fileContents);
  } else if (format === "YAML") {
    obj = YAML.parse(fileContents);
  } else {
    assertNever(format);
  }

  return obj;
}

/**
 * Generic wrapper for stringifying an object to a FileFormat
 * @param obj
 * @param format
 * @returns
 */
function stringify(obj: any, format: FileFormat) {
  switch (format) {
    case "JSON":
      return JSON.stringify(obj, null, 2);
    case "YAML":
      return YAML.stringify(obj);
    default:
      assertNever(format);
  }
}

/**
 * Write a Project object to a file
 * @param project
 * @param format
 */
async function writeProjectFile(project: Project, format: FileFormat) {
  const filePath = getProjectPath(project.name);
  const folderPath = path.dirname(filePath);
  await mkdirp(folderPath);
  const content = stringify(project, format);
  return await writeFile(filePath, content, { encoding: "utf-8" });
}

export { readFileParse, stringify, writeProjectFile };
