# oss-directory

Curated directory of open source projects and their artifacts.

## Structure

| Path                                     | Contents                                               |
| ---------------------------------------- | ------------------------------------------------------ |
| `data/projects/<first-char>/<name>.yaml` | One file per project, filed by first character of name |
| `data/collections/<name>.yaml`           | Collections grouping related projects                  |
| `src/resources/schema/project.json`      | Project JSON schema                                    |
| `src/resources/schema/collection.json`   | Collection JSON schema                                 |

## Key Commands

| Command               | Purpose                          |
| --------------------- | -------------------------------- |
| `pnpm run validate`   | Validate all YAML against schema |
| `pnpm lint`           | Check formatting                 |
| `pnpm prettier:write` | Auto-fix formatting errors       |

Always run `pnpm run validate` and `pnpm lint` before committing.

## Schema

Current version: `version: 7`

**Projects** — required fields: `version`, `name`, `display_name`

**Collections** — required fields: `version`, `name`, `display_name`, `projects`

## Project Naming

Three patterns, in order of preference:

1. **GitHub org** → use org name: `uniswap` for `github.com/uniswap`
2. **Single repo** → `[repo]-[owner]`: `myrepo-myorg` for `github.com/myorg/myrepo`
3. **Multi-repo custom** → `[project]-[distinguisher]`

Rules: lowercase, hyphen-separated, globally unique, must match filename.

Valid social fields: `twitter`, `telegram`, `farcaster`, `mirror`, `medium`
Invalid: `github` (goes in top-level `github` field), `discord`, `lens`

## Skills

| Skill                     | Use when                                             |
| ------------------------- | ---------------------------------------------------- |
| `/ossd-add-project`       | Adding a new project                                 |
| `/ossd-add-collection`    | Creating a new collection                            |
| `/ossd-update-project`    | Updating an existing project or collection           |
| `/ossd-bulk-update`       | Importing many projects from an external data source |
| `/ossd-review-pr`         | Reviewing a community pull request                   |
| `/ossd-enrich-collection` | Enriching metadata for projects in a collection      |
