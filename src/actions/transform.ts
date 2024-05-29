import { writeFile } from "fs/promises";
import path from "path";
import { glob } from "glob";
import { SingleMigration, Transformation } from "../types.js";
import { TRANSFORMATIONS } from "../transformations/index.js";
import { CommonArgs } from "../types/cli.js";
import { FileFormat, getFileExtension, getFileFormat } from "../types/files.js";
import { safeCastCollection, safeCastProject } from "../validator/index.js";
import { NullOrUndefinedValueError, UserError } from "../utils/error.js";
import { readFileParse, stringify } from "../utils/files.js";

export type TransformationArgs = CommonArgs & {
  name: string;
  collectionsDir: string;
  projectsDir: string;
};

/**
 * Generic transformation logic
 * @param args
 */
async function transform(
  transformName: string,
  directory: string,
  fileFormat: FileFormat,
  getSingleTransformation: (m: Transformation) => SingleMigration,
  validateStringify: (obj: any) => string,
) {
  const extension = getFileExtension(fileFormat);
  const files = await glob(path.resolve(directory, `**/*${extension}`));
  let count = 0;
  console.log(`Migrating files in ${directory}`);
  for (const file of files) {
    const obj = await readFileParse(file, fileFormat);

    if (!obj?.version) {
      throw new NullOrUndefinedValueError(`version missing from ${file}`);
    }

    // Look for applicable migrations
    const transformation = TRANSFORMATIONS.find(
      (x: Transformation) => x.name === transformName,
    );

    if (!transformation) {
      throw new UserError(
        `'${transformName}' does not exist in list of transformation`,
      );
    }

    count++;
    console.log(`Running '${transformName}' on ${file}`);
    // Do the transformation
    const newObj = await getSingleTransformation(transformation).up(obj);
    // Write back to disk after done migrating
    const objStr = validateStringify(newObj);
    await writeFile(file, objStr, { encoding: "utf-8" });
  }
  console.log(`Success! Transformed ${count} files`);
}

/**
 * Migrate all files in a projects directory
 * @param args
 */
async function transformProjects(args: TransformationArgs) {
  const fileFormat = getFileFormat(args.format);
  await transform(
    args.name,
    args.projectsDir,
    fileFormat,
    (x) => x.project,
    (obj: any) => {
      const p = safeCastProject(obj);
      return stringify(p, fileFormat);
    },
  );
}

/**
 * Migrate all files in a collections directory
 * @param args
 */
async function transformCollections(args: TransformationArgs) {
  const fileFormat = getFileFormat(args.format);
  await transform(
    args.name,
    args.collectionsDir,
    fileFormat,
    (x) => x.collection,
    (obj: any) => {
      const c = safeCastCollection(obj);
      return stringify(c, fileFormat);
    },
  );
}

/**
 * This the action that gets exposed to the CLI
 * @param args
 */
async function runTransformation(args: TransformationArgs) {
  await transformCollections(args);
  await transformProjects(args);
}

export { runTransformation };
