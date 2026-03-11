---
name: ossd-update-project
description: Use when modifying an existing project or collection in oss-directory — adding fields, updating URLs, fixing errors, renaming projects, or managing collection membership
---

# Update Project

You help maintainers update existing project and collection files in the oss-directory repository. This includes adding fields, updating URLs, fixing errors, or renaming projects.

## When to Use This Skill

Use this skill when:

- Adding new fields to existing project (e.g., adding npm package, blockchain address)
- Updating project information (website URL, social media)
- Fixing errors in existing files
- Renaming a project
- Adding projects to existing collection
- Removing projects from collection

Do not use this skill when:

- Creating a new project (use `add-project` skill)
- Creating a new collection (use `add-collection` skill)

## Workflow Steps

### 0. Working Directory

All commands assume you're in the oss-directory root. If not already there: `cd ~/GitHub/oss-directory`

### 1. Find the Project/Collection File

Ask user which project or collection to update, then locate the file:

```bash
# Search by keyword
find data/projects -name "*[keyword]*"
find data/collections -name "*[keyword]*"

# Or if you know the name
find data/projects -name "[project-name].yaml"
find data/collections -name "[collection-name].yaml"
```

### 2. Read Current Content

Read the file to understand current state using the Read tool with the full absolute path found in the previous step.

### 3. Make the Requested Changes

Use the Edit tool to make precise changes. Common update patterns below.

### 4. Validate Changes

After making changes, validate:

```bash
pnpm run validate
pnpm lint
```

If formatting errors, auto-fix:

```bash
pnpm prettier:write
```

### 5. Handle File Renames (If Applicable)

If renaming a project (changing the `name` field):

**Important:** This requires multiple steps:

1. Update the `name` field in the project file
2. Rename the file to match the new name
3. Move to new directory if first character changed
4. Update ALL collections that reference this project

```bash
# Example: Renaming "old-name" to "new-name"

# 1. Move/rename the file
git mv data/projects/o/old-name.yaml data/projects/n/new-name.yaml

# 2. Update name field in the file (use Edit tool)

# 3. Find all collections that reference this project
grep -r "old-name" data/collections/

# 4. Update each collection file (use Edit tool)
```

**Renaming is complex** - only do if absolutely necessary. Ask user to confirm.

### 6. Commit Changes

Commit message formats:

For adding fields:

```
Add [field] to [project-name]
```

For updates:

```
Update [project-name] [what changed]
```

For renames:

```
Rename [old-name] to [new-name]
```

For collection updates:

```
Add [projects] to [collection-name]
```

Examples from recent commits:

- `paraswap is now velora (#947)`
- `Fix formatting of telegram URL in betfin.yaml (#944)`
- `Delete data/projects/m/mega-warren.yaml (#934)`

Git commands:

```bash
git add [file-path]
git commit -m "[Commit message]"
```

**Do not push** unless explicitly requested.

## Logos

Logos live in `data/logos/[first-char]/[project-name].[ext]` — mirroring the project folder structure.

**Rules (enforced by `pnpm validate` and CI):**

- Allowed formats: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`
- Filename (without extension) must exactly match the project slug
- Must be in the correct subfolder matching the first character of the slug
- **A logo file without a matching project will fail CI** — always remove the logo when deleting a project, and update the logo filename when renaming a project

When renaming a project, also rename the logo file if one exists:

```bash
git mv data/logos/[old-char]/[old-name].[ext] data/logos/[new-char]/[new-name].[ext]
```

## Common Update Patterns

### Add GitHub Repository

```yaml
# Before
github:
  - url: https://github.com/org

# After - adding another repo
github:
  - url: https://github.com/org
  - url: https://github.com/org/another-repo
```

### Add Social Media

**Valid social fields**: `twitter`, `telegram`, `farcaster`, `mirror`, `medium`

```yaml
# Before - no social section
websites:
  - url: https://example.com

# After - add social
websites:
  - url: https://example.com
social:
  twitter:
    - url: https://twitter.com/handle
  telegram:
    - url: https://t.me/channel
```

**Note:** `github`, `discord`, `lens` are NOT valid social fields.

### Add Blockchain Address

```yaml
# Before - no blockchain section
github:
  - url: https://github.com/org

# After - add blockchain
github:
  - url: https://github.com/org
blockchain:
  - address: "0x1234567890123456789012345678901234567890"
    networks:
      - mainnet
    tags:
      - deployer
```

### Add NPM Package

```yaml
# Before
github:
  - url: https://github.com/org

# After
github:
  - url: https://github.com/org
npm:
  - url: https://www.npmjs.com/package/@org/package
```

### Update Description

```yaml
# Before
name: example
display_name: Example
description: Old description

# After
name: example
display_name: Example
description: New improved description
```

### Add Projects to Collection

```yaml
# Before
version: 7
name: ethereum-ecosystem
display_name: Ethereum Ecosystem
projects:
  - aave
  - curve
  - uniswap

# After - maintaining alphabetical order
version: 7
name: ethereum-ecosystem
display_name: Ethereum Ecosystem
projects:
  - aave
  - compound-finance
  - curve
  - maker
  - uniswap
```

### Remove Projects from Collection

```yaml
# Before
projects:
  - project-a
  - project-b
  - project-c

# After - removed project-b
projects:
  - project-a
  - project-c
```

### Fix URL Formatting

```yaml
# Before - missing protocol or wrong format
websites:
  - url: example.com

social:
  twitter:
    - url: twitter.com/handle

# After - with protocol
websites:
  - url: https://example.com

social:
  twitter:
    - url: https://twitter.com/handle
```

## Renaming Projects (Complex)

Renaming requires updating the project file AND all references to it.

### Steps:

1. **Search for all references:**

```bash
# Find which collections reference this project
grep -r "[old-project-name]" data/collections/
```

2. **Update the project file:**

   - Change `name` field
   - Rename file
   - Move to correct directory if first char changed

3. **Update all collection references:**

   - Edit each collection that referenced old name
   - Replace with new name
   - Maintain alphabetical order

4. **Validate everything:**

```bash
pnpm run validate
pnpm lint
```

5. **Commit all changes together:**

```bash
git add data/projects/[new-location]/
git add data/collections/
git commit -m "Rename [old-name] to [new-name]"
```

### Example Rename Commit

From recent history: `paraswap is now velora (#947)`

This likely involved:

- Renaming `data/projects/p/paraswap.yaml` to `data/projects/v/velora.yaml`
- Updating name field: `name: velora`
- Updating all collections that referenced `paraswap`

## Common Update Scenarios

### Scenario: Add Twitter Handle

1. Find project file
2. Read current content
3. Add social section with twitter URL
4. Validate
5. Commit: "Add Twitter to [project-name]"

### Scenario: Fix Broken Website URL

1. Find project file
2. Identify the broken URL
3. Update with correct URL
4. Validate
5. Commit: "Fix website URL in [project-name]"

### Scenario: Add Multiple Projects to Collection

1. Find collection file
2. Read current projects list
3. Add new projects (keep alphabetical)
4. Validate (ensures all projects exist)
5. Commit: "Add [X] projects to [collection-name]"

### Scenario: Merge Duplicate Projects

This is complex:

1. Identify which project to keep
2. Merge unique data from duplicate into kept project
3. Update all collections referencing the duplicate
4. Delete the duplicate file
5. Validate
6. Commit: "Merge [duplicate] into [kept-project]"

## Validation Checklist

Before committing, verify:

- [ ] `pnpm run validate` passes
- [ ] `pnpm lint` passes
- [ ] Changed fields match schema types
- [ ] URLs are valid and include protocol
- [ ] YAML formatting is correct (2 spaces)
- [ ] If renamed: all references updated
- [ ] If collection update: all referenced projects exist
- [ ] No duplicate entries in arrays

## Common Issues

**Validation fails after update:**

- Check you didn't introduce a typo
- Ensure proper YAML indentation
- Verify URLs have protocol (https://)
- Run `pnpm prettier:write` to auto-fix formatting

**Collection validation fails:**

- One of the referenced projects doesn't exist
- Check project names are spelled correctly (case-sensitive)
- Verify projects haven't been renamed

**Breaking existing collections:**

- Before renaming a project, check what references it
- Update ALL collections that reference the old name

**Formatting issues:**

- Always run `pnpm prettier:write` after manual edits
- Use 2 spaces for indentation, not tabs
- Keep consistent array formatting

## Quick Commands

Find project by keyword:

```bash
grep -r "display_name: Keyword" data/projects/
```

List all projects in a directory:

```bash
ls data/projects/[letter]/
```

Find collections containing a project:

```bash
grep -r "[project-name]" data/collections/
```

View git diff before committing:

```bash
git diff data/projects/[...]/[file].yaml
```

## Resources

Within the oss-directory repository:

- Project schema: `src/resources/schema/project.json`
- Collection schema: `src/resources/schema/collection.json`
- All projects: `data/projects/`
- All collections: `data/collections/`
