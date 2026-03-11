---
name: ossd-add-project
description: Use when adding a new project to oss-directory — creating a YAML file for a new open source project, processing a community PR, or onboarding a project from external data
---

# Add Project

You help maintainers add new projects to the oss-directory repository (https://github.com/opensource-observer/oss-directory). Each project is defined in a YAML file with metadata about the open source project and its artifacts.

## When to Use This Skill

Use this skill when:

- Adding a new project to the directory
- Processing a community PR that adds a new project
- Someone provides project information to be added

Do not use this skill when:

- Updating an existing project (use `update-project` skill)
- Adding projects to a collection (use `add-collection` skill)

## Workflow Steps

### 0. Working Directory

All commands assume you're in the oss-directory root. If not already there: `cd ~/GitHub/oss-directory`

### 1. Gather Project Information

**IMPORTANT**: Gather GitHub URL first to determine correct project name.

Ask the user for (or extract from provided info):

1. **GitHub URL** (strongly recommended) - This determines the project name:

   - If `github.com/org-name` → project name should be `org-name`
   - If `github.com/username/repo-name` → project name should be `repo-name-username`

2. **Project name** (required) - Derived from GitHub URL pattern above

   - Must be globally unique, lowercase, hyphenated
   - Examples: `uniswap`, `my-project-alice`

3. **Display name** (required) - Human-readable name

   - Examples: `Uniswap`, `My Project`

4. **Description** - 1-2 sentences maximum describing the project

5. **Website URL** - Project website

6. **Social media** - **Valid fields only**:

   - ✅ `twitter`, `telegram`, `farcaster`, `mirror`, `medium`
   - ❌ NOT `github` (GitHub URLs go in top-level `github` field)

7. **Blockchain addresses** - If provided:

   - Must specify network: `mainnet`, `optimism`, `base`, `arbitrum`, etc.
   - ❌ NOT `any_evm` (too vague)
   - Verify tags: Check etherscan to confirm `contract` vs `eoa`

8. **Other artifacts** - npm, crates, pypi, etc.

### 2. Determine File Location

Projects are organized alphabetically by first character:

- Path format: `data/projects/[first-char]/[project-name].yaml`
- `[first-char]` = first character of project name (lowercase)
  - Numbers go in folders `0-9`
  - Special chars/symbols go in appropriate folders or fallback to `0`
- Examples:
  - `uniswap` → `data/projects/u/uniswap.yaml`
  - `0xproject` → `data/projects/0/0xproject.yaml`

### 3. Create Project YAML File

Required fields:

```yaml
version: 7
name: project-name
display_name: Project Name
```

Common optional fields:

```yaml
description: 1-2 sentence description of the project
websites:
  - url: https://example.com
social:
  twitter:
    - url: https://twitter.com/handle
  telegram:
    - url: https://t.me/channel
  farcaster:
    - url: https://warpcast.com/~/channel/name
  mirror:
    - url: https://mirror.xyz/username
  medium:
    - url: https://medium.com/@username
github:
  - url: https://github.com/org
  - url: https://github.com/org/repo
npm:
  - url: https://www.npmjs.com/package/package-name
blockchain:
  - address: "0x..."
    networks:
      - mainnet
    tags:
      - contract
```

**Important:**

- Always use `version: 7`
- Name must match the filename (without `.yaml`)
- Include at least one GitHub URL if available
- URLs should include protocol (`https://`)
- Use proper YAML indentation (2 spaces)

**Social Field Validation:**

- ✅ Valid: `twitter`, `telegram`, `farcaster`, `mirror`, `medium`
- ❌ Invalid: `github` (goes in top-level `github` field), `discord`, `lens` (not in schema)

### 4. Add a Logo (Optional)

If a logo is available for the project, add it to the logos directory:

- **Allowed formats:** `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`
- **Filename:** must exactly match the project slug (e.g. `uniswap.png` for project `uniswap`)
- **Location:** `data/logos/[first-char]/[project-name].[ext]` — same subfolder structure as projects
  - `uniswap` → `data/logos/u/uniswap.png`
  - `1inch` → `data/logos/1/1inch.png`

A logo without a matching project will cause `pnpm validate` (and CI) to fail.

### 5. Validate and Lint

Run validation in the oss-directory repo:

```bash
pnpm run validate
pnpm lint
```

If there are formatting errors, auto-fix with:

```bash
pnpm prettier:write
```

### 6. Commit Changes

Only commit after successful validation.

Commit message format:

```
Add [Project Display Name] (#PR-number if applicable)

or

Create [filename].yaml
```

Examples from recent commits:

- `Add Kumbaya (#942)`
- `Create earnm.yaml for EARN'M project setup (#943)`
- `Add Planet IX project metadata (#945)`

Git commands:

```bash
git add data/projects/[first-char]/[project-name].yaml
git add data/logos/[first-char]/[project-name].[ext]  # if a logo was added
git commit -m "Add [Project Display Name]"
```

**Do not push** unless explicitly requested by the user.

## Project Naming Conventions

**Official Documentation:** https://docs.oso.xyz/docs/projects/#give-your-project-a-unique-name-slug

The `name` field is the **unique identifier** for the project and must match the YAML filename exactly. Choose the pattern that best fits the project structure:

### Pattern 1: GitHub Organization Name (Recommended)

**Use when:** The project has a dedicated GitHub organization.

**Format:** Use the GitHub org name exactly as it appears (lowercase, hyphenated)

**Examples:**

```yaml
# For https://github.com/opensource-observer
name: opensource-observer
display_name: Open Source Observer
github:
  - url: https://github.com/opensource-observer
# File: data/projects/o/opensource-observer.yaml
```

### Pattern 2: Monorepo in Larger Organization

**Use when:** The project is a single repo within a larger GitHub org or personal account.

**Format:** `[repo-name]-[owner-name]`

**Examples:**

```yaml
# For https://github.com/my-org/my-repo
name: my-repo-my-org
display_name: My Repo
github:
  - url: https://github.com/my-org/my-repo
# File: data/projects/m/my-repo-my-org.yaml
```

### Pattern 3: Collection of Repos (Custom Name)

**Use when:** Project spans multiple repos but you don't want to use the org name.

**Format:** `[project-name]-[distinguisher]`

**Examples:**

```yaml
# For a project with multiple repos across different orgs
name: projectx-my-space
display_name: Project X
github:
  - url: https://github.com/my-space/projectx-frontend
  - url: https://github.com/my-space/projectx-backend
  - url: https://github.com/my-space/projectx-docs
# File: data/projects/p/projectx-my-space.yaml
```

### Naming Rules

**Required:**

- ✅ **Globally unique** - No other project can have the same name
- ✅ **Lowercase only** - No uppercase letters
- ✅ **Hyphen-separated** - Use hyphens, not underscores or camelCase
- ✅ **Match filename** - If file is `my-project.yaml`, name must be `my-project`
- ✅ **Match directory** - File goes in folder matching first character of name

**Format:**

- ✅ `my-project` - Correct
- ❌ `My-Project` - No uppercase
- ❌ `my_project` - No underscores
- ❌ `myProject` - No camelCase

**Special Cases:**

- **Numbers first:** `0xproject`, `1inch`, `88mph`
- **Special characters:** Remove them (`$PROJECT` → `project`)

**Display Name:**

- Must also be globally unique
- Can have spaces and capitals
- Example: `name: my-project` → `display_name: My Project`

## Common Patterns

### GitHub Organizations vs Repos

```yaml
# Prefer organization URL when the project has multiple repos
github:
  - url: https://github.com/uniswap

# Use specific repo URLs when that's all they have
github:
  - url: https://github.com/username/single-repo
```

### Social Media

**Valid social fields only** (per schema):

```yaml
social:
  twitter:
    - url: https://twitter.com/handle
  telegram:
    - url: https://t.me/username
  farcaster:
    - url: https://warpcast.com/~/channel/channelname
  mirror:
    - url: https://mirror.xyz/username
  medium:
    - url: https://medium.com/@username
```

**Note:** `discord` and `lens` are NOT valid social fields per the schema.

### Blockchain Addresses

**Important validations:**

- Use **specific network names**: `mainnet`, `optimism`, `base`, `arbitrum`, etc.
- ❌ Do NOT use `any_evm` (too vague)
- Verify tags by checking etherscan (for mainnet):
  - Visit `https://etherscan.io/address/[address]`
  - If shows "Contract: Verified" → use `contract` tag
  - If has transactions but no code → use `eoa` tag

```yaml
blockchain:
  - address: "0x1234567890123456789012345678901234567890"
    networks:
      - mainnet
    tags:
      - contract # Use if it's a smart contract
      - deployer # Contract deployer
      - wallet # General wallet
  - address: "0xanotheraddress..."
    networks:
      - optimism
    tags:
      - eoa # Externally owned account
      - safe # Gnosis Safe
```

## Validation Checklist

Before committing, verify:

- [ ] File is in correct directory based on first character
- [ ] Filename matches project `name` field exactly
- [ ] `version: 7` is set
- [ ] Required fields present: `version`, `name`, `display_name`
- [ ] At least one GitHub URL included (if available)
- [ ] All URLs include protocol (`https://`)
- [ ] YAML is properly indented (2 spaces)
- [ ] `pnpm run validate` passes
- [ ] `pnpm lint` passes
- [ ] No duplicate project (check for existing projects with same name/GitHub org)

## Common Issues

**Duplicate project names:**

- Check if project already exists: `find data/projects -name "*[search-term]*"`
- If name conflict, append qualifier (e.g., `-protocol`, `-labs`, `-finance`)

**Formatting errors:**

- Run `pnpm prettier:write` to auto-fix
- Check indentation (2 spaces, not tabs)
- Ensure URLs are quoted if they contain special chars

**Missing GitHub URL:**

- GitHub URL is not strictly required but highly recommended
- Projects without GitHub may have limited visibility in OSO

## Example Project File

```yaml
version: 7
name: example-protocol
display_name: Example Protocol
description: A decentralized protocol for example purposes
websites:
  - url: https://example.com
social:
  twitter:
    - url: https://twitter.com/exampleprotocol
  telegram:
    - url: https://t.me/exampleprotocol
github:
  - url: https://github.com/example-protocol
npm:
  - url: https://www.npmjs.com/package/@example/protocol
blockchain:
  - address: "0x1234567890123456789012345678901234567890"
    networks:
      - mainnet
    tags:
      - deployer
```

## Resources

- OSO docs: https://docs.oso.xyz/docs/projects

Within the oss-directory repository:

- Project schema: `src/resources/schema/project.json`
- Example projects: `data/projects/`
