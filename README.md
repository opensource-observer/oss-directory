# OSS Directory [![License: Apache 2.0][license-badge]][license]

[license]: https://opensource.org/license/apache-2-0/
[license-badge]: https://img.shields.io/badge/License-Apache2.0-blue.svg

This repository contains a curated directory of open source software (OSS) projects and their associated artifacts. Artifacts include git repositories, npm packages, smart contracts, Open Collective collectives, accounts used for managing grant funds, and more. Groups of related projects are organized into collections.

The OSS Directory serves as the "source of truth" for the projects and collections that are discoverable on [Open Source Observer](https://www.opensource.observer).

While the directory may never be complete, it is actively maintained. We welcome community contributions of new projects and collections, as well as updates to existing entries.

This directory is a public good, free to use and distribute. We hope it serves the needs of researchers, developers, foundations, and other users looking to better understand the OSS ecosystem!

## How to contribute

Currently the main way to contribute is by submitting a pull request. You can update any `.yaml` file under `./data/` or submit a new one. Fork this repository, commit your changes, and open a pull request from your fork to this repository.

Detailed instructions are available in the [latest docs](https://docs.opensource.observer/docs/contribute/project-data).

If you are adding a new project, please make sure to include a unique project name to identify the project and at least one GitHub url. In most cases, we adopt the GitHub organization name as the project name. Our project naming conventions are described in more detail [here](https://docs.opensource.observer/docs/contribute/project-data/#project-names) - please try to follow them!

Submissions will be validated to ensure they conform to the schema and don't contain any artifacts that are already in the directory. If you are unsure or have additional questions about contributing, please open an issue or message us on [Discord](https://www.opensource.observer/discord).

### Setup for local development

You can install dependencies with `pnpm`.

```bash
pnpm install
```

### Validation

Our GitHub actions CI will reject any contributions that do not conform to the schema defined in `./src/resources/schema`.

To check for validation errors locally, run

```bash
pnpm run validate
```

## Using as a library

We have also published this repository as a library that you can use in your own projects. This is useful if you want to build a tool that uses the data in this repository or perform your own custom analysis.

We have libraries for JavaScript and Python. We don't store the entire dataset with the package. Under the hood, this will clone the repository into a temporary directory, read all the data files, validate the schema, and return the objects. This way, you know you're getting the latest data, even if the package hasn't been updated in a while.

_Note: These do not work in a browser-environment_

### JavaScript library

[npm page](https://www.npmjs.com/package/oss-directory)

#### Installation

Install the library

```bash
npm install oss-directory
# OR yarn add oss-directory
# OR pnpm add oss-directory
```

#### Fetch all of the data

You can fetch all of the data in this repo with the following:

```js
import { Project, Collection, fetchData } from "oss-directory";

const data = await fetchData();
const projects: Project[] = data.projects;
const collections: Collection[] = data.collections;
```

#### Utility functions

We also include functions for casting and validating data:

- `validateProject`
- `validateCollection`
- `safeCastProject`
- `safeCastCollection`

### Python library

[PyPI page](https://pypi.org/project/oss-directory/)

#### Installation

Install the library

```bash
pip install oss-directory
# OR poetry add oss-directory
```

#### Fetch all of the data

You can fetch all of the data in this repo with the following:

```python
from ossdirectory import fetch_data
from ossdirectory.fetch import OSSDirectory

data: OSSDirectory = fetch_data()
projects: List[dict] = data.projects;
collections: List[dict] = data.collections;
```

## Organization

The directory is organized into two main folders:

- `./data/projects` - each file represents a single open source project and contains all of the artifacts for that project.
  - See `./src/resources/schema/project.json` for the expected JSON schema
  - Files should be named by the project "name"
  - Project names must be globally unique. If there is a conflict in chosen name, we will give priority to the project that has the associated GitHub organization
  - In most cases, we adopt the GitHub organization name as the `name`.
- `./data/collections` - each file represents a collection of projects that have some collective meaning (e.g. all projects in an ecosystem).
  - See `./src/resources/schema/collection.json` for the expected JSON schema
  - Projects are identified by their unique project `name`.

## Scripting changs

Sometimes you need to make a bunch of changes all at once. We have a framework that supports 2 types of such changes:

1. **Migrations**: If you are changing the schema of the data files, you'll need to write a migration that changes all data files to adhere to the new schema
2. **Transformations**: If you want to write a one-off transformation that does not change the schema, use this

### Changing the schema with migrations

🚨⚠️ **Note**: Please use this sparingly. In the current setup, all upstream dependents of this package will break anytime there is a schema change. This is because older versions of the library will try to get the latest data from the main branch and break when validating it against an older schema ️️🚨⚠️

All files under `./data` must conform to schemas defined in `./src/resources/schema`.

If you want to change the schema, you'll need to write a migration:

1. Update the schema in `src/resources/schema/`
2. Add a [version]-[desc].ts file to the `src/migrations/` folder, exporting functions that migrate each file type.
3. Add the migration functions to the MIGRATIONS array in `src/migrations/index.ts`.
4. You can run the migration by running `pnpm migrate`.
5. Please run `pnpm validate` to make sure your migration adheres to the schema. We will not accept any PRs where the data does not conform to the schemas.
6. Commit and submit a pull request with all of the resulting changes.
7. Publish a new version of the npm package. Remember to bump the version number in `package.json`. If you don't do this, you'll break all downstream dependents, because they're fetching the latest from GitHub.
8. Notify all upstream dependents of this package that there is a new major version number and they need to update. Schema changes **will** break any dependent builds until they upgrade.

The framework will run migrations in sequence, so you are guaranteed that your data is valid as of the previous version.
Note: we currently only support migrating in one direction (and not reverting)

### Running a one-off transformation

If you need to make a wide-ranging change that does not affect the schema, use these steps to script the change

1. Add a [transformName].ts file to the `src/transformations/` folder, exporting functions that transform each file type.
2. Add the transformation functions to the TRANSFORMATIONS array in `src/transformations/index.ts`.
3. You can run the transformation by running `pnpm transform --name <transformName>`
4. Please run `pnpm validate` to make sure your migration adheres to the schema. We will not accept any PRs where the data does not conform to the schemas.
5. Commit and submit a pull request with all of the resulting changes.

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
