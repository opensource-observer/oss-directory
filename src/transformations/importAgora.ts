import fs from "node:fs/promises";
import _ from "lodash";
import { parse } from "csv/sync";
import { Transformation } from "../types.js";
import { loadData } from "../fetchData.js";
import { Project } from "../types/project.js";

// We don't have a good way to pass in arguments to transformations
// Let's just grab the file from .env
const inputFile = process.env.INPUT_FILE;
// For loading oss-directory data locally
const OSO_BASE_PATH = "./";
// Mappings of all column names in the CSV
const COL = {
  projectId: "Project ID",
  projectName: "Project name",
  username: "Username",
  email: "Email",
  description: "Description",
  twitter: "Twitter",
  mirror: "Mirror",
  website: "Website",
  farcaster: "Farcaster",
  osoSlug: "Open source observer slug",
  contractAddress: "Contract address",
  deployerAddress: "Deployer address",
  deploymentHash: "Deployment hash",
  chainId: "Chain ID",
  url: "URL",
  verified: "Verified",
};

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
    name: _.kebabCase(_.lowerCase(agoraProj.name)),
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
  if (githubUrls.length > 0) {
    result.github = strArrToUrlArr(githubUrls);
  }
  if (npmUrls.length > 0) {
    result.npm = strArrToUrlArr(npmUrls);
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
  if (deployerAddresses.length > 0) {
    result.blockchain = deployerAddresses.map((address) => ({
      address,
      tags: ["eoa", "deployer"],
      networks: ["any_evm"],
    }));
  }
  return result;
};

// Load the data just once globally
let loaded = false;
// OSO slug => AgoraProject
let data: AgoraProject[];
// Used to read the input CSV file
async function readInput() {
  // First check if we've already loaded the data to a global
  if (loaded) {
    return;
  } else if (!inputFile) {
    throw new Error("Missing INPUT_FILE environment variable");
  }

  // Read the CSV
  const fileContent = await fs.readFile(inputFile);
  const csvRows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(`Processing ${csvRows.length} rows`);
  //console.log(csvRows[0]);
  const groupByProjectId = _.groupBy(csvRows, (r) => r[COL.projectId]);
  console.log(`${_.keys(groupByProjectId).length} unique projects`);

  // Start populating AgoraProjects
  const agoraProjectsWithoutArtifacts = _.mapValues(groupByProjectId, (arr) => {
    const first = arr[0];
    return {
      agoraProjectId: first[COL.projectId],
      name: first[COL.projectName],
    };
  });
  //console.log(_.values(agoraProjectsWithoutArtifacts));
  // Used to prepend 'https://'
  const normalizeUrl = (url: string): string[] => {
    return !url
      ? []
      : !url.startsWith("https://")
        ? [`https://${url.trim()}`]
        : [url.trim()];
  };
  // Sometimes we get a JSON stringified String array
  const normalizeJsonArrayString = (arr: string): string[] => {
    const parsed = JSON.parse(arr);
    return _.isArray(parsed)
      ? _.flatten(parsed.map(normalizeUrl))
      : normalizeUrl(parsed);
  };
  // Flatten a CSV row to an array of artifacts
  const rowToArtifacts = (row: any): string[] => [
    row[COL.deployerAddress].trim(),
    ...normalizeUrl(row[COL.twitter]),
    //...normalizeUrl(row[COL.mirror]),
    ...normalizeUrl(row[COL.url]),
    ...normalizeJsonArrayString(row[COL.website]),
    ...normalizeJsonArrayString(row[COL.farcaster]),
  ];
  const collapsed = _.mapValues(groupByProjectId, (arr) =>
    _.flatten(arr.map(rowToArtifacts)),
  );
  console.log("Collapsed");
  const collapsedDedupe = _.mapValues(collapsed, _.uniq);
  console.log("Deduped");

  // Load oss-directory from local filesystem
  const osoData = await loadData(OSO_BASE_PATH);
  // Used to find the OSO slug from a list of artifacts
  const findOsoProject = (artifacts: string[]) => {
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
      return _.intersection(artifacts, compareArtifacts).length > 0;
    });
  };
  // Populate artifacts into the AgoraProjects
  const agoraProjectMap = _.mapValues(agoraProjectsWithoutArtifacts, (x) => ({
    ...x,
    osoProjectSlug: findOsoProject(collapsedDedupe[x.agoraProjectId])?.name,
    artifacts: collapsedDedupe[x.agoraProjectId],
  }));
  const agoraProjectList = _.values(agoraProjectMap);
  const newProjects = agoraProjectList.filter((x) => !x.osoProjectSlug);
  console.log(
    `Found ${newProjects.length} new projects, ${
      agoraProjectList.length - newProjects.length
    } existing ones`,
  );
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
  const merged = _.merge(toMerge, existing);
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
