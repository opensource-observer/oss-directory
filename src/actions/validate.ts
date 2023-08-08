import { glob } from "glob";
import path from "path";
import { readCollectionFile, readProjectFile } from "../index.js";
import { FileFormat } from "../types/files.js";
import { UserError } from "../utils/error.js";
import { assertNever } from "../utils/common.js";
import { getProjectPath } from "../utils/format.js";

export type ValidateArgs = {
  dir: string;
  format: string;
};

/**
 * Uses glob to retrieve all files in a directory with the given format/extension
 * @param args ValidateArgs
 * @returns
 */
async function getFiles(args: ValidateArgs) {
  const { dir, format } = args;
  if (format !== "yaml" && format !== "json") {
    throw new UserError(`Invalid format: ${format}`);
  }

  const fileFormat: FileFormat =
    format === "yaml"
      ? "YAML"
      : format === "json"
      ? "JSON"
      : assertNever(format);
  const files = await glob(path.resolve(dir, `**/*.${format}`));
  return { fileFormat, files };
}

/**
 * Validates all collections in a directory
 * @param args
 */
export async function validateCollections(args: ValidateArgs) {
  const { fileFormat, files } = await getFiles(args);
  console.log(`Validating collections in ${args.dir}`);
  for (const file of files) {
    // Check each file conforms to `Collection` schema
    const collection = await readCollectionFile(file, { format: fileFormat });
    // Make sure that all projects in the collection exist
    for (const projectSlug of [...collection.projects]) {
      const projectFile = getProjectPath(projectSlug);
      await readProjectFile(projectFile, { format: fileFormat });
    }
  }
  console.log(`Success! Validated ${files.length} files`);
}

/**
 * Validates all projects in a directory
 * @param args
 */
export async function validateProjects(args: ValidateArgs) {
  const { fileFormat, files } = await getFiles(args);
  console.log(`Validating projects in ${args.dir}`);
  for (const file of files) {
    // Check each file conforms to `Project` schema
    await readProjectFile(file, { format: fileFormat });
  }
  console.log(`Success! Validated ${files.length} files`);
}
