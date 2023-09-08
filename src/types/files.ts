import { UserError } from "../utils/error.js";
import { assertNever } from "../utils/common.js";

type FileFormat = "JSON" | "YAML";
const DEFAULT_FORMAT: FileFormat = "YAML";

function getFileFormat(input: string): FileFormat {
  if (input !== "yaml" && input !== "json") {
    throw new UserError(`Invalid format: ${input}`);
  }

  const fileFormat: FileFormat =
    input === "yaml" ? "YAML" : input === "json" ? "JSON" : assertNever(input);

  return fileFormat;
}

function getFileExtension(format: FileFormat): string {
  switch (format) {
    case "JSON":
      return ".json";
    case "YAML":
      return ".yaml";
    default:
      return assertNever(format);
  }
}

export { FileFormat, DEFAULT_FORMAT, getFileFormat, getFileExtension };
