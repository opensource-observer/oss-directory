import _ from "lodash";
import { glob } from "glob";
import path from "path";
import { readCollectionFile, readProjectFile } from "../validator/index.js";
import { assert } from "../utils/common.js";
import { getProjectPath } from "../utils/format.js";
import { currentVersion } from "../migrations/index.js";
import { CommonArgs } from "../types/cli.js";
import { getFileExtension, getFileFormat } from "../types/files.js";

const IGNORE_GLOB = "**/README.md";

export type ValidateArgs = CommonArgs & {
  dir: string;
};

/**
 * Validates all collections in a directory
 * @param args
 */
export async function validateCollections(args: ValidateArgs) {
  const fileFormat = getFileFormat(args.format);
  const extension = getFileExtension(fileFormat);
  const files = await glob(path.resolve(args.dir, `**/*${extension}`));
  const extraneousFiles = _.difference(
    await glob(path.resolve(args.dir, `**/*`), {
      nodir: true,
      ignore: IGNORE_GLOB,
    }),
    files,
  );
  assert(
    extraneousFiles.length === 0,
    `These files do not belong: ${JSON.stringify(extraneousFiles, null, 2)}`,
  );
  console.log(`Validating collections in ${args.dir}`);
  for (const file of files) {
    // Check each file conforms to `Collection` schema
    const collection = await readCollectionFile(file, { format: fileFormat });
    const baseName = path.basename(file, extension);
    assert(
      collection.name === baseName,
      `Filename must match name(${collection.name}): ${file}`,
    );
    assert(
      collection.version === currentVersion,
      `Collection version(${collection.version}) must be ${currentVersion}: ${file}`,
    );
    // Make sure that all projects in the collection exist
    for (const projectName of [...collection.projects]) {
      const projectFile = getProjectPath(projectName);
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
  const fileFormat = getFileFormat(args.format);
  const extension = getFileExtension(fileFormat);
  const files = await glob(path.resolve(args.dir, `**/*${extension}`));
  const extraneousFiles = _.difference(
    await glob(path.resolve(args.dir, `**/*`), {
      nodir: true,
      ignore: IGNORE_GLOB,
    }),
    files,
  );
  assert(
    extraneousFiles.length === 0,
    `These files do not belong: ${JSON.stringify(extraneousFiles, null, 2)}`,
  );
  // Keep track of which keys we've seen to make sure they're unique
  const keyToFilename: Record<string, string[]> = {};
  const addKey = (key: string, val: string) =>
    keyToFilename[key]
      ? keyToFilename[key].push(val)
      : (keyToFilename[key] = [val]);

  console.log(`Validating projects in ${args.dir}`);
  for (const file of files) {
    // Check each file conforms to `Project` schema
    const project = await readProjectFile(file, { format: fileFormat });
    const baseName = path.basename(file, extension);
    assert(
      baseName === project.name,
      `Filename must match name(${project.name}): ${file}`,
    );
    assert(
      project.version === currentVersion,
      `Project version(${project.version}) must be ${currentVersion}: ${file}`,
    );
    project.github?.forEach((x) => addKey(x.url, file));
    project.npm?.forEach((x) => addKey(x.url, file));
    project.blockchain?.forEach((x) =>
      x.networks.forEach((n) => addKey(`${n}:${x.address}`, file)),
    );
  }

  // Make sure that there's only 1 project per key
  const withDuplicates = _.pickBy(keyToFilename, (val) => val.length > 1);
  assert(
    _.keys(withDuplicates).length <= 0,
    `Duplicates found: ${JSON.stringify(withDuplicates, null, 2)}`,
  );

  console.log(`Success! Validated ${files.length} files`);
}
