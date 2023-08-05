# oss-directory

Open source projects often consist of many different artifacts (e.g. git repositories, npm packages, Open Collective collectives).
With this repository, we'd love to crowdsource these artifacts so that we can better analyze their impact in the open.

In this repository, you'll find schemas for defining artifacts, as well as the crowd-sourced data for open source projects.
All data are specified in [YAML](https://yaml.org/) files.
The data is not complete, and likely will never be fully up to date as new projects are created and updated every day.

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

1. Update the appropriate schemas in 
2. Write a migration script (TODO: not implemented yet)
3. Run your migration with `yarn migrate` (TODO: not implemented yet)
4. Submit the pull request with all changes.
