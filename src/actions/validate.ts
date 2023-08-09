import { glob } from "glob";
import path from "path";
import { readCollectionFile, readProjectFile } from "../index.js";
import { FileFormat } from "../types/files.js";
import { UserError } from "../utils/error.js";
import { assert, assertNever } from "../utils/common.js";
import { getProjectPath } from "../utils/format.js";
import { currentVersion } from "../utils/migration.js";

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
  const extension = `.${format}`;
  const files = await glob(path.resolve(dir, `**/*${extension}`));
  return { files, fileFormat, extension };
}

/**
 * Validates all collections in a directory
 * @param args
 */
export async function validateCollections(args: ValidateArgs) {
  const { files, fileFormat, extension } = await getFiles(args);
  console.log(`Validating collections in ${args.dir}`);
  for (const file of files) {
    // Check each file conforms to `Collection` schema
    const collection = await readCollectionFile(file, { format: fileFormat });
    const baseName = path.basename(file, extension);
    assert(
      collection.slug === baseName,
      `Filename must match slug(${collection.slug}): ${file}`,
    );
    assert(
      collection.version === currentVersion,
      `Collection version(${collection.version}) must be ${currentVersion}: ${file}`,
    );
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
  const { files, fileFormat, extension } = await getFiles(args);
  console.log(`Validating projects in ${args.dir}`);
  for (const file of files) {
    // Check each file conforms to `Project` schema
    const project = await readProjectFile(file, { format: fileFormat });
    const baseName = path.basename(file, extension);
    assert(
      baseName === project.slug,
      `Filename must match slug(${project.slug}): ${file}`,
    );
    assert(
      project.version === currentVersion,
      `Project version(${project.version}) must be ${currentVersion}: ${file}`,
    );
  }
  console.log(`Success! Validated ${files.length} files`);
}
