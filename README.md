# OSS Directory

This repository contains a curated directory of open source software (OSS) projects and their associated artifacts. Artifacts include git repositories, npm packages, smart contracts, Open Collective collectives, accounts used for managing grant funds, and more. Groups of related projects are organized into collections.

The OSS Directory serves as the "source of truth" for the projects and collections that are discoverable on [Open Source Observer](https://opensource.observer).  

While the directory may never be complete, it is actively maintained. We welcome community contributions of new projects and collections, as well as updates to existing entries.

This directory is a public good, free to use and distribute. We hope it serves the needs of researchers, developers, foundations, and other users looking to better understand the OSS ecosystem!

## How to contribute

Currently the main way to contribute is by submitting a pull request. You can update any `.yaml` file under `./data/` or submit a new one. Fork this repository, commit your changes, and open a pull request from your fork to this repository.

If you are adding a new project, please make sure to include a unique slug to identify the project and at least one GitHub url. In most cases, we adopt the GitHub organization name as the slug. If the project is not associated with a GitHub organization, you can use the project name followed by the repo owner as the slug.

Submissions will be validated to ensure they conform to the schema and don't contain any artifacts that are already in the directory. If you are unsure or have additional questions about contributing, please open an issue or message us on [Telegram](https://t.me/osocommunity).

## Using as a library

We have also published this repository as a library that you can use in your own projects. This is useful if you want to build a tool that uses the data in this repository or perform your own custom analysis.

### Installation

Install the library

```bash
npm install oss-directory
# OR yarn add oss-directory
```

### Fetch all of the data

You can fetch all of the data in this repo with the following:

```js
import { Project, Collection, fetchData } from "oss-directory";

const data = await fetchData();
const projects: Project[] = data.projects;
const collections: Collection[] = data.collections;
```

We don't store the entire dataset with the npm package. Under the hood, this will clone the repository into a temporary directory, read all the data files, validate the schema, and return the objects. This way, you know you're getting the latest data, even if the npm package hasn't been updated in a while.

### Utility functions

We also include functions for casting and validating data:

- `validateProject`
- `validateCollection`
- `safeCastProject`
- `safeCastCollection`

## Organization

The directory is organized into two main folders:

- `./data/projects` - each file represents a single open source project and contains all of the artifacts for that project.
  - See `./src/resources/schema/project.json` for the expected JSON schema
  - Files should be named by the project "slug"
  - Project slugs must be globally unique. If there is a conflict in chosen slug, we will give priority to the project that has the associated GitHub organization
  - In most cases, we adopt the GitHub organization name as the slug. If the project is not associated with a GitHub organization, you try to use the project name followed by the repo owner as the slug.
- `./data/collections` - each file represents a collection of projects that have some collective meaning (e.g. all projects in an ecosystem).
  - See `./src/resources/schema/collection.json` for the expected JSON schema
  - Projects are identified by their unique slug

## Changing the schemas

All files under `./data` must conform to schemas defined in `./src/resources/schema`.
Our continuous integration system will reject any pull requests that do not validate against the schema.

If you want to change the schema, you'll need to write a migration:

1. Update the schema in `src/resources/schema/`
2. Add a [version]-[desc].ts file to the `src/migrations/` folder, exporting functions that migrate each file type.
3. Add the migration functions to the MIGRATIONS array in `src/migrations/index.ts`.
4. You can run the migration by running `pnpm migrate`
5. Make sure to commit and submit a pull request with all of the resulting changes. We will not accept any PRs where the data does not conform to the schemas.

The framework will run migrations in sequence, so you are guaranteed that your data is valid as of the previous version.
Note: we only currently support migrating in one direction (and not reverting)

## Making onchain attestations about projects

### EAS schemas

We've created a schema for making project attestations with [EAS](https://attest.sh/). These attestations create an onchain link between a GitHub repo and its blockchain addresses (ie, that smart contracts and contract factories under its control).

You can view the schemas here:

- optimism-goerli: [Schema 168](https://optimism-goerli-bedrock.easscan.org/schema/view/0x739257b1bf8533a29a5c59a6dda5905c50f7c2bf436d709cd9ea7bfabbe5172b)

- optimism: [Schema 86](https://optimism.easscan.org/schema/view/0x739257b1bf8533a29a5c59a6dda5905c50f7c2bf436d709cd9ea7bfabbe5172b)

### EAS attestations

You can make a series of attestations about a project by running the following:

```bash
ts-node src/scripts/optimism-attestation.ts data/projects/P/PROJECT.yaml optimism # OR optimism-goerli
```

Make sure you have `.env` file that contains your `PRIVATE_KEY` for an account with some ETH on the appropriate network.
