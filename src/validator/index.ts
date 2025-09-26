import { Project, ProjectSchema } from "../types/project.js";
import { Collection, CollectionSchema } from "../types/collection.js";
import { URL, UrlSchema } from "../types/url.js";
import { SocialProfile, SocialProfileSchema } from "../types/social-profile.js";
import {
  BlockchainAddress,
  BlockchainAddressSchema,
} from "../types/blockchain-address.js";
import { DEFAULT_FORMAT, FileFormat } from "../types/files.js";
import { readFileParse } from "../utils/files.js";
import { z } from "zod";

type Schema =
  | "project.json"
  | "collection.json"
  | "url.json"
  | "social-profile.json"
  | "blockchain-address.json";
const schemaMap = {
  "url.json": UrlSchema,
  "project.json": ProjectSchema,
  "collection.json": CollectionSchema,
  "social-profile.json": SocialProfileSchema,
  "blockchain-address.json": BlockchainAddressSchema,
} as const;
const PROJECT_SCHEMA: Schema = "project.json";
const COLLECTION_SCHEMA: Schema = "collection.json";
const URL_SCHEMA: Schema = "url.json";
const SOCIAL_PROFILE_SCHEMA: Schema = "social-profile.json";
const BLOCKCHAIN_ADDRESS_SCHEMA: Schema = "blockchain-address.json";
/**
 * The result of a validation.
 * @property valid - Whether the data is valid.
 * @property errors - A map of errors, where the key is the field that failed validation and the value is the error message.
 */
type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

/**
 * Generic validate helper function
 * @param obj- path to the file
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */

function validateObject(obj: unknown, schemaName: Schema): ValidationResult {
  const schema = schemaMap[schemaName];

  if (!schema) {
    return { valid: false, errors: { schema: "Schema not found" } };
  }

  const result = schema.safeParse(obj);

  if (result.success) {
    return { valid: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  const formatted = result.error;
  for (const [key, value] of Object.entries(formatted)) {
    if (key === "_errors") continue;

    if (value && typeof value === "object" && "_errors" in value) {
      const fieldErrors = (value as z.ZodFormattedError<any, string>)._errors;
      errors[key] = fieldErrors.join(", ");
    }
  }

  return { valid: false, errors };
}

function safeCastObject<T>(obj: any, schemaName: Schema): T {
  const result = validateObject(obj, schemaName);
  if (!result.valid) {
    console.log("Invalid ", schemaName);
    console.log(JSON.stringify(obj, null, 2));
    console.warn(JSON.stringify(result.errors, null, 2));
    throw new Error(`Invalid ${schemaName}`);
  }
  return obj;
}

/**
 * Generic validate helper function for files
 * @param filename - path to the file
 * @param format - whether it's JSON or YAML
 * @param schemaName - the schema to validate against
 * @returns T
 */
async function readFileToObject<T>(
  filename: string,
  schemaName: Schema,
  opts: ReadOptions,
): Promise<T> {
  const obj = await readFileParse(filename, opts.format);
  if (opts.skipValidation) {
    return obj;
  }
  return safeCastObject<T>(obj, schemaName);
}

/**
 * Validates the data for a project
 * @param obj - JSON object
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
function validateProject(obj: any): ValidationResult {
  return validateObject(obj, PROJECT_SCHEMA);
}

/**
 * Validates the data for a collection
 * @param obj - JSON object
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
function validateCollection(obj: any): ValidationResult {
  return validateObject(obj, COLLECTION_SCHEMA);
}

/**
 * Validates the data for a url
 * @param obj - JSON object
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
function validateUrl(obj: any): ValidationResult {
  return validateObject(obj, URL_SCHEMA);
}

/**
 * Validates the data for a blockchain address
 * @param obj - JSON object
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
function validateBlockchainAddress(obj: any): ValidationResult {
  return validateObject(obj, BLOCKCHAIN_ADDRESS_SCHEMA);
}

/**
 * Casts an object into a Project
 * @param obj - JSON object
 * @returns Project
 * @throws if not a valid Project
 */
function safeCastProject(obj: any): Project {
  return safeCastObject<Project>(obj, PROJECT_SCHEMA);
}

/**
 * Casts an object into a Collection
 * @param obj - JSON object
 * @returns Collection
 * @throws if not a valid Collection
 */
function safeCastCollection(obj: any): Collection {
  return safeCastObject<Collection>(obj, COLLECTION_SCHEMA);
}

/**
 * Casts an object into a URL
 * @param obj - JSON object
 * @returns URL
 * @throws if not a valid URL
 */
function safeCastUrl(obj: any): URL {
  return safeCastObject<URL>(obj, URL_SCHEMA);
}

/**
 * Casts an object into a URL
 * @param obj - JSON object
 * @returns SocialProfile
 * @throws if not a valid URL
 */
function safeCastSocialProfile(obj: any): SocialProfile {
  return safeCastObject<SocialProfile>(obj, SOCIAL_PROFILE_SCHEMA);
}

/**
 * Casts an object into a BlockchainAddress
 * @param obj - JSON object
 * @returns BlockchainAddress
 * @throws if not a valid BlockchainAddress
 */
function safeCastBlockchainAddress(obj: any): BlockchainAddress {
  return safeCastObject<BlockchainAddress>(obj, BLOCKCHAIN_ADDRESS_SCHEMA);
}

type ReadOptions = {
  format: FileFormat;
  skipValidation: boolean;
};

/**
 * Reads the data for a project file
 * @param filename - path to the file
 * @returns Project
 * @throws if not a valid Project
 */
async function readProjectFile(
  filename: string,
  opts?: Partial<ReadOptions>,
): Promise<Project> {
  return readFileToObject<Project>(filename, PROJECT_SCHEMA, {
    format: opts?.format ?? DEFAULT_FORMAT,
    skipValidation: opts?.skipValidation ?? false,
  });
}

/**
 * Validates the data for a collection file
 * @param filename - path to the file
 * @returns Collection
 * @throws if not a valid Collection
 */
async function readCollectionFile(
  filename: string,
  opts?: Partial<ReadOptions>,
): Promise<Collection> {
  return readFileToObject<Collection>(filename, COLLECTION_SCHEMA, {
    format: opts?.format ?? DEFAULT_FORMAT,
    skipValidation: opts?.skipValidation || false,
  });
}

export {
  ReadOptions,
  validateProject,
  validateCollection,
  validateUrl,
  validateBlockchainAddress,
  safeCastProject,
  safeCastCollection,
  safeCastUrl,
  safeCastSocialProfile,
  safeCastBlockchainAddress,
  readProjectFile,
  readCollectionFile,
};
