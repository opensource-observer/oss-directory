import Ajv from "ajv";
import { readFile } from "fs/promises";
import YAML from "yaml";
import projectSchema from "../resources/schema/project.json" assert { type: 'json' };
import collectionSchema from "../resources/schema/collection.json" assert { type: 'json' };
import { Project } from "../types/project.js";
import { Collection } from "../types/collection.js";
import { assertNever } from "../util/common.js";

// Initialize Ajv
type FileFormat = "JSON" | "YAML";
const DEFAULT_FORMAT: FileFormat = "YAML";
type Schema = "project" | "collection";
const PROJECT_SCHEMA: Schema = "project";
const COLLECTION_SCHEMA: Schema = "collection";
const ajv = new Ajv.default({ allErrors: true }); // options can be passed, e.g. {allErrors: true}
ajv.addSchema(projectSchema, PROJECT_SCHEMA);
ajv.addSchema(collectionSchema, COLLECTION_SCHEMA);

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
 * Generic validate helper function for files
 * @param filename - path to the file
 * @param format - whether it's JSON or YAML
 * @param schemaName - the schema to validate against
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
async function validateFile<T>(filename: string, format: FileFormat, schemaName: Schema): Promise<ValidationResult> {
  const fileContents = await readFile(filename, { encoding: "utf-8" });
  let obj;

  // Parse JSON
  try {
    if (format === "JSON") {
      obj = JSON.parse(fileContents);
    } else if (format === "YAML") {
      obj = YAML.parse(fileContents);
    } else {
      assertNever(format);
    }
  } catch (e) {
    return { valid: false, errors: { file: "Invalid JSON" } };
  }

  return validateObject<T>(obj, schemaName);
}

/**
 * Generic validate helper function
 * @param obj- path to the file
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
async function validateObject<T>(obj: any, schemaName: Schema): Promise<ValidationResult> {
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

type ValidateOptions = {
  format?: FileFormat;
};

/**
 * Validates the data for a project file
 * @param filename - path to the file
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
async function validateProjectFile(filename: string, opts?: ValidateOptions): Promise<ValidationResult> {
  return validateFile<Project>(filename, opts?.format ?? DEFAULT_FORMAT, PROJECT_SCHEMA);
}

/**
 * Validates the data for a collection file
 * @param filename - path to the file
 * @returns A `ValidationResult` object indicating whether the data is valid and any errors that were found.
 */
async function validateCollectionFile(filename: string, opts: ValidateOptions): Promise<ValidationResult> {
  return validateFile<Collection>(filename, opts?.format ?? DEFAULT_FORMAT, COLLECTION_SCHEMA);
}

export {
  validateProjectFile,
  validateCollectionFile,
};
