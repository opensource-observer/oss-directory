import _ from "lodash";
import { glob } from "glob";
import path from "path";
import { readCollectionFile, readProjectFile } from "../validator/index.js";
import { assert } from "../utils/common.js";
import { getProjectPath } from "../utils/format.js";
import { currentVersion } from "../migrations/index.js";
import { CommonArgs } from "../types/cli.js";
import { getFileExtension, getFileFormat } from "../types/files.js";

const ALLOWED_LOGO_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
]);

const IGNORE_GLOB = "**/README.md";

export type ValidateArgs = CommonArgs & {
  dir: string;
};

export type ValidateLogosArgs = CommonArgs & {
  logosDir: string;
  projectsDir: string;
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
    `These files do not belong: ${JSON.stringify(
      extraneousFiles,
      null,
      2,
    )}\nAre you sure all files end in '${extension}'?`,
  );
  console.log(`Validating collections in ${args.dir}`);
  for (const file of files) {
    let currentProjectFile = null;
    try {
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
        currentProjectFile = projectFile;
        await readProjectFile(projectFile, { format: fileFormat });
      }
    } catch (e) {
      if (!currentProjectFile) {
        console.error("Error validating ", file);
      } else {
        console.error("Error validating ", currentProjectFile);
      }
      throw e;
    }
  }
  console.log(`Success! Validated ${files.length} collections`);
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
    `These files do not belong: ${JSON.stringify(
      extraneousFiles,
      null,
      2,
    )}\nAre you sure all files end in '${extension}'?`,
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
    try {
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
      // No conflicting display_name
      addKey(project.display_name, file);
      // Check that all URLs belong to a single project file
      project.github?.forEach((x) => addKey(x.url, file));
      project.npm?.forEach((x) => addKey(x.url, file));
      project.crates?.forEach((x) => addKey(x.url, file));
      project.go?.forEach((x) => addKey(x.url, file));
      project.pypi?.forEach((x) => addKey(x.url, file));
      project.open_collective?.forEach((x) => addKey(x.url, file));
      project.defillama?.forEach((x) => addKey(x.url, file));
      // Check that all blockchain addresses belong to a single project file
      project.blockchain?.forEach((x) =>
        x.networks.forEach((n) => addKey(`${n}:${x.address}`, file)),
      );
    } catch (e) {
      console.error("Error validating ", file);
      throw e;
    }
  }

  // Make sure that there's only 1 project per key
  const withoutDuplicates = _.mapValues(keyToFilename, (files: string[]) =>
    _.uniq(files),
  );
  const overlappingKeys = _.pickBy(withoutDuplicates, (val) => val.length > 1);
  assert(
    _.keys(overlappingKeys).length <= 0,
    `Duplicates found: ${JSON.stringify(overlappingKeys, null, 2)}`,
  );

  console.log(`Success! Validated ${files.length} projects`);
}

/**
 * Validates all logos in a directory against the project slugs
 * Rules:
 * - Logo file must be an image (png, jpg, jpeg, svg, gif, webp)
 * - Logo filename (without extension) must exactly match a project slug
 * - Logo must be in the correct subfolder: logos/<first-char>/
 * - No logo without a corresponding project (logos are optional for projects)
 */
export async function validateLogos(args: ValidateLogosArgs) {
  const fileFormat = getFileFormat(args.format);
  const extension = getFileExtension(fileFormat);

  // Collect all known project slugs
  const projectFiles = await glob(
    path.resolve(args.projectsDir, `**/*${extension}`),
  );
  const projectSlugs = new Set(
    projectFiles.map((f) => path.basename(f, extension)),
  );

  // Collect all files in the logos directory
  const logoFiles = await glob(path.resolve(args.logosDir, `**/*`), {
    nodir: true,
  });

  console.log(`Validating logos in ${args.logosDir}`);
  const errors: string[] = [];

  for (const file of logoFiles) {
    const ext = path.extname(file).toLowerCase();
    const slug = path.basename(file, ext);
    const parentDir = path.basename(path.dirname(file));
    const expectedParent = slug.charAt(0).toLowerCase();

    // Must be an allowed image type
    if (!ALLOWED_LOGO_EXTENSIONS.has(ext)) {
      errors.push(
        `Not an allowed image type (${ext}): ${file}\nAllowed: ${[
          ...ALLOWED_LOGO_EXTENSIONS,
        ].join(", ")}`,
      );
      continue;
    }

    // Must be in the correct subfolder
    if (parentDir !== expectedParent) {
      errors.push(
        `Logo is in wrong folder '${parentDir}', expected '${expectedParent}': ${file}`,
      );
    }

    // Must correspond to an existing project
    if (!projectSlugs.has(slug)) {
      errors.push(
        `Logo '${path.basename(
          file,
        )}' has no matching project with slug '${slug}': ${file}`,
      );
    }
  }

  assert(
    errors.length === 0,
    `Logo validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
  );

  console.log(`Success! Validated ${logoFiles.length} logo files`);
}
