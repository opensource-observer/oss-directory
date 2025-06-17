import _ from "lodash";
import { glob } from "glob";
import path from "path";
import { readProjectFile } from "../validator/index.js";
import { assert } from "../utils/common.js";
import { getFileFormat, getFileExtension } from "../types/files.js";
import { CommonArgs } from "../types/cli.js";

export type ValidateLogoArgs = CommonArgs & {
  dir: string;
  projectsDir: string;
};

/**
 * Validates that all logos in data/logos have corresponding project files
 * @param args
 */
export async function validateLogos(args: ValidateLogoArgs) {
  const fileFormat = getFileFormat(args.format);
  const projectExtension = getFileExtension(fileFormat);
  
  // Get all image files in data/logos and its subfolders
  const logoFiles = await glob(path.resolve(args.dir, "data/logos/**/*"), {
    nodir: true,
    ignore: ["**/*.md", "**/*.txt"] // Ignore documentation files
  });
  
  console.log(`Found ${logoFiles.length} logo files to validate`);
  
  // Get all project files
  const projectFiles = await glob(path.resolve(args.projectsDir, `**/*${projectExtension}`));
  console.log(`Found ${projectFiles.length} project files`);
  
  // Extract project names from project files
  const projectNames = new Set<string>();
  for (const file of projectFiles) {
    try {
      const project = await readProjectFile(file, { format: fileFormat });
      projectNames.add(project.name);
    } catch (e) {
      console.error(`Error reading project file ${file}:`, e);
    }
  }
  
  // Check if each logo has a corresponding project
  const missingProjectLogos: string[] = [];
  
  for (const logoFile of logoFiles) {
    // Extract image name without extension
    const logoName = path.basename(logoFile, path.extname(logoFile));
    
    // Skip if it's a special case (like default logos, etc.)
    if (logoName === 'default' || logoName === 'placeholder') {
      continue;
    }
    
    // Check if a project with this name exists
    if (!projectNames.has(logoName)) {
      missingProjectLogos.push(logoFile);
    }
  }
  
  // Assert that there are no missing projects for logos
  assert(
    missingProjectLogos.length === 0,
    `These logos don't have corresponding project files: ${JSON.stringify(
      missingProjectLogos,
      null,
      2
    )}\nPlease create project files with matching names.`
  );
  
  console.log(`Success! All ${logoFiles.length} logo files have corresponding project files`);
}