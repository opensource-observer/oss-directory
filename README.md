# oss-directory

Open source projects often consist of many different artifacts (e.g. git repositories, npm packages, smart contracts, Open Collective collectives).
With this repository, we'd love to crowdsource these artifacts so that we can better analyze their impact in the open.

In this repository, you'll find schemas for defining artifacts, as well as the crowd-sourced data for open source projects.
All data are specified in [YAML](https://yaml.org/) files.
The data is not complete, and likely will never be fully up to date as new projects are created and updated every day.

## Using as a library

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

We don't store the entire dataset with the npm package.
Under the hood, this will clone the repository into a temporary directory,
read all the data files, validate the schema, and return the objects.
This way, you know you're getting the latest data, even if the npm package hasn't been updated in a while.

### Utility functions

We also include functions for casting and validating data:

- `validateProject`
- `validateCollection`
- `safeCastProject`
- `safeCastCollection`

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

## How to contribute

Currently the main way to contribute is by submitting a pull request.
You can update any `.yaml` file under `./data/` or edit an existing one.

Simply fork this repository and open a pull request from your fork to this repository.

### Organization

- `./data/projects` - each file represents a single open source project and contains all of the artifacts for that project.
  - See `./src/resources/schema/project.json` for the expected JSON schema
  - Files should be named by the project "slug"
  - Project slugs must be globally unique. If there is a conflict in chosen slug, we will give priority to the project that has the associated GitHub organization
- `./data/collections` - each file represents a collection of projects that have some collective meaning (e.g. all projects in an ecosystem).
  - See `./src/resources/schema/collection.json` for the expected JSON schema
  - Projects are identified by their unique slug

### Changing the schemas

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
