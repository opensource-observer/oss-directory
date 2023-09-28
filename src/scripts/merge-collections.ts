import fs from "fs";
import { parse, stringify } from "yaml";

interface CollectionData {
  version: number;
  slug: string;
  name: string;
  projects: string[];
}

if (process.argv.length !== 4) {
  console.error(
    "Usage: merge_collections.ts <master-collection> <new-collection>",
  );
  process.exit(1);
}

const masterCollectionFile = process.argv[2];
const newCollectionFile = process.argv[3];

const masterCollectionContent = fs.readFileSync(masterCollectionFile, "utf8");
const newCollectionContent = fs.readFileSync(newCollectionFile, "utf8");

const masterCollection: CollectionData = parse(masterCollectionContent);
const newCollection: CollectionData = parse(newCollectionContent);

if (masterCollection.version !== 3 || newCollection.version !== 3) {
  console.error("Error: Unsupported version in one or both collections");
  process.exit(1);
}

newCollection.name = masterCollection.name;
newCollection.slug = masterCollection.slug;

masterCollection.projects = [
  ...new Set([...masterCollection.projects, ...newCollection.projects]),
];

const mergedYaml = stringify(masterCollection);
fs.writeFileSync(masterCollectionFile, mergedYaml);

console.log(`Merged collections written to ${masterCollectionFile}`);

// ts-node-esm src/scripts/merge-collections.ts data/collections/optimism.yaml data/collections/op-govgrants.yaml
