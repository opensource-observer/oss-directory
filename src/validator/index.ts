import Ajv from "ajv";
import addFormats from "ajv-formats";
import projectSchema from "../resources/schema/project.json" assert { type: "json" };
import collectionSchema from "../resources/schema/collection.json" assert { type: "json" };
import urlSchema from "../resources/schema/url.json" assert { type: "json" };
import blockchainAddressSchema from "../resources/schema/blockchain-address.json" assert { type: "json" };
import { Project } from "../types/project.js";
import { Collection } from "../types/collection.js";
import { URL } from "../types/url.js";
import { BlockchainAddress } from "../types/blockchain-address.js";
import { DEFAULT_FORMAT, FileFormat } from "../types/files.js";
import { readFileParse } from "../utils/files.js";

// Initialize Ajv
type Schema =
  | "project.json"
  | "collection.json"
  | "url.json"
  | "blockchain-address.json";
const PROJECT_SCHEMA: Schema = "project.json";
const COLLECTION_SCHEMA: Schema = "collection.json";
const URL_SCHEMA: Schema = "url.json";
const BLOCKCHAIN_ADDRESS_SCHEMA: Schema = "blockchain-address.json";
const ajv = new Ajv.default({ allErrors: true }); // options can be passed, e.g. {allErrors: true}
addFormats.default(ajv);
ajv.addSchema(projectSchema, PROJECT_SCHEMA);
ajv.addSchema(collectionSchema, COLLECTION_SCHEMA);
ajv.addSchema(urlSchema, URL_SCHEMA);
ajv.addSchema(blockchainAddressSchema, BLOCKCHAIN_ADDRESS_SCHEMA);

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
function validateObject<T>(obj: any, schemaName: Schema): ValidationResult {
  const validate = ajv.getSchema<T>(schemaName);

  // Check missing validator
  if (!validate) {
    return { valid: false, errors: { schema: "Schema not found" } };
  } else if (!validate(obj)) {
    // Enumerate validation errors
    const errors: Record<string, string> = {};
    for (const e of validate.errors || []) {
      const key = e.params.missingProperty || "other";
      if (key && e.message) {
        errors[key] = e.message;
      }
    }
    return { valid: false, errors };
  }

  return { valid: true, errors: {} };
}

function safeCastObject<T>(obj: any, schemaName: Schema): T {
  const result = validateObject<T>(obj, schemaName);
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
  return validateObject<Project>(obj, PROJECT_SCHEMA);
}

/**
 * Validates the data for a collection
 * @param obj - JSON object
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
function validateCollection(obj: any): ValidationResult {
  return validateObject<Collection>(obj, COLLECTION_SCHEMA);
}

/**
 * Validates the data for a url
 * @param obj - JSON object
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
function validateUrl(obj: any): ValidationResult {
  return validateObject<URL>(obj, URL_SCHEMA);
}

/**
 * Validates the data for a blockchain address
 * @param obj - JSON object
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
function validateBlockchainAddress(obj: any): ValidationResult {
  return validateObject<BlockchainAddress>(obj, BLOCKCHAIN_ADDRESS_SCHEMA);
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
  validateProject,
  validateCollection,
  validateUrl,
  validateBlockchainAddress,
  safeCastProject,
  safeCastCollection,
  safeCastUrl,
  safeCastBlockchainAddress,
  readProjectFile,
  readCollectionFile,
};
