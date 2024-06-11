import fs from "node:fs/promises";
import _ from "lodash";
import * as csv from "csv/sync";
import { Transformation } from "../types.js";
import { loadData } from "../fetchData.js";
import { Project } from "../types/project.js";
import { mergeProjects } from "../utils/format.js";
import { writeProjectFile } from "../utils/files.js";
import { ensure } from "../utils/common.js";

// We don't have a good way to pass in arguments to transformations,
// so we'll grab them from the .env file
// This should be an absolute path to the file from Agora
const INPUT_FILE = process.env.INPUT_FILE;
// Possible values are "JSON" and "CSV"
const INPUT_FORMAT = process.env.INPUT_FORMAT ?? "JSON";
// Set this to true if we want to create non-existing projects
const CREATE_NEW_FILES = process.env.CREATE_NEW_FILES ?? false;
// For loading oss-directory data locally
const OSO_BASE_PATH = "./";
// FileFormat
const FILE_FORMAT = "YAML";

type Getters = {
  osoSlug: (obj: any) => string | undefined;
  projectId: (obj: any) => string;
  projectName: (obj: any) => string;
  description: (obj: any) => string | undefined;
  twitter: (obj: any) => string[];
  mirror: (obj: any) => string[];
  website: (obj: any) => string[];
  farcaster: (obj: any) => string[];
  deployerAddress: (obj: any) => string[];
  repos: (obj: any) => string[];
};
// Used to prepend 'https://'
const getOsoName = (str?: string) =>
  !str ? undefined : _.kebabCase(_.lowerCase(str).replace(/[^a-z0-9-_ ]/g, ""));
const trimArray = (arr: string[]) => _.compact(arr).map((x) => x.trim());
const normalizeUrlArray = (arr: string[]) => {
  const trimmed = trimArray(arr);
  return trimmed.map((url) =>
    url.startsWith("https://") ? url : `https://${url}`,
  );
};
const firstToken = (str: string) => str.split(" ")[0];
const JSON_GETTERS: Getters = {
  projectId: (obj: any) => ensure(obj.id, "Missing Project ID").trim(),
  osoSlug: (obj: any) => obj.openSourceObserverSlug?.trim(),
  projectName: (obj: any) => ensure(obj.name, "Missing Project name").trim(),
  description: (obj: any) =>
    obj.description?.replace(/(\r\n|\n|\r)/gm, "").trim(),
  twitter: (obj: any) => normalizeUrlArray(obj.twitter ? [obj.twitter] : []),
  mirror: (obj: any) => normalizeUrlArray(obj.mirror ? [obj.mirror] : []),
  website: (obj: any) => normalizeUrlArray([...obj.website.map(firstToken)]),
  farcaster: (obj: any) => normalizeUrlArray([...obj.farcaster]),
  repos: (obj: any) =>
    normalizeUrlArray([
      ...obj.repos.filter((x: any) => x.verified).map((x: any) => x.url),
    ]),
  deployerAddress: (obj: any) =>
    trimArray([
      ...obj.contracts
        .filter((x: any) => x.verificationProof)
        .map((x: any) => x.deployerAddress),
    ]),
};
const CSV_GETTERS: Getters = {
  projectId: (obj: any) =>
    ensure(obj["Project ID"], "Missing Project ID").trim(),
  osoSlug: (obj: any) => obj["Open source observer slug"]?.trim(),
  projectName: (obj: any) =>
    ensure(obj["Project name"], "Missing Project name").trim(),
  description: (obj: any) => obj["Description"]?.trim(),
  twitter: (obj: any) =>
    normalizeUrlArray(obj["Twitter"] ? [obj["Twitter"]] : []),
  mirror: (obj: any) => normalizeUrlArray(obj["Mirror"] ? [obj["Mirror"]] : []),
  website: (obj: any) =>
    normalizeUrlArray(obj["Website"] ? [...JSON.parse(obj["Website"])] : []),
  farcaster: (obj: any) =>
    normalizeUrlArray(
      obj["Farcaster"] ? [...JSON.parse(obj["Farcaster"])] : [],
    ),
  repos: (obj: any) => normalizeUrlArray(obj["URL"] ? [obj["URL"]] : []),
  deployerAddress: (obj: any) =>
    trimArray(obj["Deployer address"] ? [obj["Deployer address"]] : []),
};
// Default to CSV
const GETTERS: Getters = INPUT_FORMAT === "JSON" ? JSON_GETTERS : CSV_GETTERS;

// Structure the CSV data in a useful way
type AgoraProject = {
  agoraProjectId: string;
  osoProjectSlug?: string;
  name: string;
  artifacts: string[];
};

/**
 * Creates a Project object to be merged later
 * @param agoraProj
 * @returns
 */
const agoraToOsoProject = (agoraProj: AgoraProject): Project => {
  const result: Project = {
    version: 7,
    name:
      agoraProj.osoProjectSlug ??
      ensure(getOsoName(agoraProj.name), "Missing OSO name"),
    display_name: agoraProj.name,
  };
  const strToUrlObj = (url: string) => ({ url });
  const strArrToUrlArr = (urls: string[]) => urls.map(strToUrlObj);
  const githubUrls = agoraProj.artifacts.filter((x) =>
    x.startsWith("https://github.com"),
  );
  const npmUrls = agoraProj.artifacts.filter(
    (x) =>
      x.startsWith("https://npmjs.com/") ||
      x.startsWith("https://www.npmjs.com/"),
  );
  const twitterUrls = agoraProj.artifacts.filter(
    (x) =>
      x.startsWith("https://twitter.com/") || x.startsWith("https://x.com/"),
  );
  const farcasterUrls = agoraProj.artifacts.filter((x) =>
    x.startsWith("https://warpcast.com/"),
  );
  const deployerAddresses = agoraProj.artifacts.filter((x) =>
    x.startsWith("0x"),
  );
  const websiteUrls = _.xor(agoraProj.artifacts, [
    ...deployerAddresses,
    ...twitterUrls,
    ...farcasterUrls,
    ...npmUrls,
    ...githubUrls,
  ]);
  if (websiteUrls.length > 0) {
    result.websites = strArrToUrlArr(websiteUrls);
  }
  if (twitterUrls.length > 0) {
    result.social = {
      ...result.social,
      twitter: strArrToUrlArr(twitterUrls),
    };
  }
  if (farcasterUrls.length > 0) {
    result.social = {
      ...result.social,
      farcaster: strArrToUrlArr(farcasterUrls),
    };
  }
  if (githubUrls.length > 0) {
    result.github = strArrToUrlArr(githubUrls);
  }
  if (npmUrls.length > 0) {
    result.npm = strArrToUrlArr(npmUrls);
  }
  if (deployerAddresses.length > 0) {
    result.blockchain = deployerAddresses.map((address) => ({
      address,
      tags: ["eoa", "deployer"],
      networks: ["any_evm"],
    }));
  }
  return result;
};

/**
 * Creates a project file per new Agora project
 * - Be careful to only use this with confirmed new projects
 *  It will overwrite existing files if they exist
 */
async function createNewOsoProjectFiles(agoraProjects: AgoraProject[]) {
  //console.log(JSON.stringify(agoraProjects, null, 2));
  const osoProjects = agoraProjects.map(agoraToOsoProject);
  const promises = osoProjects.map(async (p) => {
    //console.log(`Writing to ${filePath}`);
    await writeProjectFile(p, FILE_FORMAT);
  });
  await Promise.all(promises);
}

// Load the data just once globally
let loaded = false;
// OSO slug => AgoraProject
let data: AgoraProject[];
// Used to read the input CSV file
async function readInput() {
  // First check if we've already loaded the data to a global
  if (loaded) {
    return;
  } else if (!INPUT_FILE) {
    throw new Error("Missing INPUT_FILE environment variable");
  }

  // Read the CSV
  const fileBuffer = await fs.readFile(INPUT_FILE);
  const fileContent = fileBuffer.toString();
  const rows =
    INPUT_FORMAT === "JSON"
      ? JSON.parse(fileContent)
      : csv.parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
        });

  if (!_.isArray(rows)) {
    throw new Error("Input file must be an array");
  }
  console.log(`Processing ${rows.length} rows`);
  //console.log(csvRows[0]);
  const groupByProjectId = _.groupBy(rows, (r) => GETTERS.projectId(r));
  console.log(`${_.keys(groupByProjectId).length} unique projects`);

  // Flatten a CSV row to an array of artifacts
  const rowToArtifacts = (row: any): string[] => [
    ...GETTERS.website(row),
    ...GETTERS.repos(row),
    ...GETTERS.twitter(row),
    ...GETTERS.farcaster(row),
    ...GETTERS.deployerAddress(row),
  ];
  const collapsed = _.mapValues(groupByProjectId, (arr) =>
    _.flatten(arr.map(rowToArtifacts)),
  );
  console.log("Collapsed");
  const agoraIdToArtifacts = _.mapValues(collapsed, _.uniq);
  console.log("Deduped");

  // Load oss-directory from local filesystem
  const osoData = await loadData(OSO_BASE_PATH);
  // Used to find the OSO slug from a list of artifacts
  const findOsoProject = (agoraProj: AgoraProject) => {
    return osoData.projects.find((p) => {
      // Get all the relevant artifacts from the Project
      const compareArtifacts = [
        ...(p.blockchain ? p.blockchain.map((x) => x.address) : []),
        ...(p.github ? p.github.map((x) => x.url) : []),
        ...(p.npm ? p.npm.map((x) => x.url) : []),
        ...(p.websites ? p.websites.map((x) => x.url) : []),
        ...(p.social?.twitter ? p.social.twitter.map((x) => x.url) : []),
      ];
      // Look for any intersection
      return (
        p.name === agoraProj.osoProjectSlug ||
        _.intersection(agoraProj.artifacts, compareArtifacts).length > 0 ||
        p.name === getOsoName(agoraProj.name)
      );
    });
  };

  //console.log(_.values(agoraProjectsWithoutArtifacts));
  // Populate artifacts into the AgoraProjects
  // Start populating AgoraProjects
  const agoraProjectMap = _.mapValues(groupByProjectId, (arr) => {
    const first = arr[0];
    const agoraProjectId = GETTERS.projectId(first);
    const agoraProj = {
      agoraProjectId,
      name: GETTERS.projectName(first),
      osoProjectSlug: GETTERS.osoSlug(first),
      artifacts: agoraIdToArtifacts[agoraProjectId],
    };
    return {
      ...agoraProj,
      osoProjectSlug: findOsoProject(agoraProj)?.name,
    };
  });

  const agoraProjectList = _.values(agoraProjectMap);
  const newProjects = agoraProjectList.filter((x) => !x.osoProjectSlug);
  console.log(
    `Found ${newProjects.length} new projects, ${
      agoraProjectList.length - newProjects.length
    } existing ones`,
  );

  // Opt-in to write new project files
  if (CREATE_NEW_FILES) {
    await createNewOsoProjectFiles(newProjects);
    console.log("STOP. Done creating new files.");
    return process.exit(0);
  }
  //console.log(agoraProjectList.slice(0,1));

  // Store this data globally
  loaded = true;
  data = agoraProjectList;
}

/**
 * Import and merge Agora data
 * @param existing
 * @returns
 */
async function updateProjects(existing: any): Promise<any> {
  // Read the CSV only on the first run of this function
  await readInput();

  // Look for the relevant project from Agora dataset
  const agoraProjectMap = _.keyBy(data, "osoProjectSlug");
  const agoraProject = agoraProjectMap[existing.name];
  if (!agoraProject) {
    return existing;
  }

  // Merge it!
  const toMerge = agoraToOsoProject(agoraProject);
  const merged = mergeProjects(toMerge, existing);
  //console.log(JSON.stringify(merged, null, 2));
  // We will validate the schema before writing to disk
  return merged;
}

const transformation: Transformation = {
  name: "importAgora",
  collection: {
    up: async (existing: any) => existing, // No change for collections
  },
  project: {
    up: updateProjects,
  },
};
export default transformation;
