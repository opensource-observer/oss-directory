import assert from "assert";
import { glob } from "glob";
import path from "path";
import { getFileFormat, getFileExtension } from "../types/files.js";
import { ValidateArgs } from "./validate.js";
import { readProjectFile } from "../validator/index.js";

const DEFILLAMA_API_BASE_URL = "https://api.llama.fi";

/**
 * Extracts a Defillama slug from a URL
 * @param url
 */
const extractDefillamaSlug = (url: URL) => {
  if (url.hostname !== "defillama.com") {
    return null;
  }
  const match = url.pathname.match(/^\/protocol\/(.+)$/);

  return match ? match[1] : null;
};

/**
 * Validates a Defillama slug
 * @param slug
 */
const validateDefillamaSlug = async (slug: string) => {
  const request = await fetch(`${DEFILLAMA_API_BASE_URL}/protocol/${slug}`, {
    method: "HEAD",
    headers: {
      "User-Agent": "OpenSource Observer/1.0",
    },
  });

  return request.ok;
};

export async function validateDefillamaSlugs(args: ValidateArgs) {
  const fileFormat = getFileFormat(args.format);
  const extension = getFileExtension(fileFormat);
  const files = await glob(path.resolve(args.dir, `**/*${extension}`));
  for (const file of files) {
    try {
      const project = await readProjectFile(file, { format: fileFormat });
      // Check that all Defillama slugs are valid
      await project.defillama?.reduce(async (prev, { url }) => {
        await prev;
        const slug = extractDefillamaSlug(new URL(url));
        assert(slug, `Could not extract Defillama slug from ${url}: ${file}`);
        const isValid = await validateDefillamaSlug(slug);
        assert(isValid, `Defillama slug ${slug} is invalid: ${file}`);
      }, Promise.resolve());
    } catch (e) {
      console.error("Error validating ", file);
      throw e;
    }
  }
  console.log(`Success! Validated ${files.length} files`);
}
