---
name: ossd-add-collection
description: Use when creating a new collection of related projects in oss-directory — by ecosystem, grant round, thematic grouping, or external list
---

# Add Collection

You help maintainers create new collections in the oss-directory repository. Collections are groups of related projects organized by ecosystem, grant program, or other meaningful categorization.

## When to Use This Skill

Use this skill when:

- Creating a new collection of related projects
- Organizing projects by ecosystem (e.g., "Arbitrum Ecosystem")
- Grouping grant recipients or program participants
- Creating thematic collections (e.g., "DeFi Protocols")

Do not use this skill when:

- Adding a single project (use `add-project` skill)
- Updating an existing collection (use `update-project` skill)

## Workflow Steps

### 0. Working Directory

All commands assume you're in the oss-directory root. If not already there: `cd ~/GitHub/oss-directory`

### 1. Gather Collection Information

Ask the user for (or extract from provided info):

- **Collection name** (required) - Unique identifier, lowercase, hyphenated
  - Examples: `ethereum-crypto-ecosystems`, `arb-stip-1`, `optimism-retro-funding-3`
- **Display name** (required) - Human-readable name
  - Examples: `Ethereum (Crypto Ecosystems)`, `Arbitrum STIP Round 1`, `Optimism Retro Funding 3`
- **Description** - Brief description of what this collection represents
- **Projects list** (required) - Array of project names to include
  - Must be existing project names from the directory

### 2. Determine File Location

Collections are stored in a flat directory:

- Path: `data/collections/[collection-name].yaml`
- Examples:
  - `ethereum-crypto-ecosystems.yaml`
  - `arb-stip-1.yaml`
  - `optimism-retro-funding-3.yaml`

### 3. Verify Projects Exist

Before creating the collection, verify all project names exist:

```bash
# For each project name, verify it exists
find data/projects -name "[project-name].yaml"
```

If any projects don't exist:

- Ask user if they want to add them first (use `add-project` skill)
- Or remove them from the collection list

### 4. Create Collection YAML File

Required format:

```yaml
version: 7
name: collection-name
display_name: Collection Display Name
projects:
  - project-one
  - project-two
  - project-three
```

With optional description:

```yaml
version: 7
name: collection-name
display_name: Collection Display Name
description: Brief description of this collection
projects:
  - project-one
  - project-two
  - project-three
```

**Important:**

- Always use `version: 7`
- Collection name must match filename (without `.yaml`)
- `projects` array must have at least 1 item
- Project names must match exactly (case-sensitive)
- Projects are typically listed alphabetically

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

The validator will check:

- All referenced projects exist
- Schema compliance
- No duplicate project entries

### 6. Commit Changes

Only commit after successful validation.

Commit message format:

```
Add [Collection Display Name] collection

or

Create [collection-name].yaml
```

Examples from recent commits:

- `Create dao-drops.yaml`
- `Add Arbitrum STIP Round 1 collection`

Git commands:

```bash
git add data/collections/[collection-name].yaml
git commit -m "Add [Collection Display Name] collection"
```

**Do not push** unless explicitly requested by the user.

## Common Patterns

### Ecosystem Collections

Collections of projects in a blockchain ecosystem:

```yaml
version: 7
name: arbitrum-ecosystem
display_name: Arbitrum Ecosystem
description: Projects building on Arbitrum
projects:
  - aave
  - curve
  - gmx
  - uniswap
```

### Grant/Funding Round Collections

Collections of grant recipients:

```yaml
version: 7
name: optimism-retro-funding-3
display_name: Optimism Retro Funding Round 3
description: Recipients of Optimism Retro Funding Round 3
projects:
  - project-a
  - project-b
  - project-c
```

### Thematic Collections

Collections grouped by category:

```yaml
version: 7
name: defi-protocols
display_name: DeFi Protocols
description: Decentralized finance protocols
projects:
  - aave
  - compound-finance
  - curve
  - uniswap
```

## Validation Checklist

Before committing, verify:

- [ ] Filename matches collection `name` field exactly
- [ ] `version: 7` is set
- [ ] Required fields present: `version`, `name`, `display_name`, `projects`
- [ ] All project names in the list exist in the directory
- [ ] No duplicate project entries
- [ ] Projects are sorted alphabetically (recommended)
- [ ] YAML is properly indented (2 spaces)
- [ ] `pnpm run validate` passes
- [ ] `pnpm lint` passes
- [ ] No duplicate collection (check existing collections)

## Common Issues

**Referenced project doesn't exist:**

- Run: `find data/projects -name "[project-name].yaml"`
- If not found, add the project first or remove from collection

**Duplicate collection name:**

- Check existing collections: `ls data/collections/`
- Choose a different name or append qualifier

**Project name mismatch:**

- Project names are case-sensitive
- Must match the `name` field in the project file exactly
- Common error: using display name instead of project name

**Formatting errors:**

- Run `pnpm prettier:write` to auto-fix
- Ensure proper YAML indentation (2 spaces)

## Finding Project Names

To find the correct project name (not display name):

```bash
# Search by keyword
grep -r "display_name: Keyword" data/projects/

# List all projects
find data/projects -name "*.yaml" -exec basename {} .yaml \;

# Read a specific project file
cat data/projects/[first-char]/[project-name].yaml
```

## Finding Existing Projects from GitHub URLs

**CRITICAL**: When you have a list of GitHub repository URLs and need to find which oss-directory projects they map to, you MUST use the proper search strategy. Simply looking for filenames matching the org name is insufficient.

### Why Simple Filename Search Fails

Many repos map to projects in non-obvious ways:

- **Different project names**: `defillama` GitHub org → `defi-llama.yaml` project file
- **Specific repo mappings**: `argotorg/solidity` → `solidity-ethereum.yaml` (not `argotorg.yaml`)
- **Umbrella organizations**: Multiple repos like `a16z-crypto/helios`, `a16z-crypto/magi` → single `a16z-crypto.yaml`
- **Org name variations**: `transferwise` GitHub org → `wise.yaml` project file

### Proper Search Strategy (Priority Order)

When searching for a GitHub URL like `github.com/ethereum/go-ethereum`:

**1. Search for the specific repo URL first:**

```bash
grep -r "github.com/ethereum/go-ethereum" data/projects/
```

This finds projects that explicitly list this specific repository, even if the project name doesn't match the org.

**2. If not found, search for the org URL:**

```bash
grep -r "github.com/ethereum" data/projects/
```

This finds org-level projects that track all repos from that organization.

**3. If still not found, try filename match:**

```bash
find data/projects -name "ethereum.yaml"
```

This is the fallback for when the project file directly matches the org name.

### Real-World Examples

**Example 1: Specific Repo Mapping**

```bash
# Looking for: github.com/argotorg/solidity
grep -r "github.com/argotorg/solidity" data/projects/
# Returns: data/projects/s/solidity-ethereum.yaml

# This would FAIL:
find data/projects -name "argotorg.yaml"
# Returns: (nothing)
```

**Example 2: Org-Level Project**

```bash
# Looking for: github.com/succinctlabs/sp1
grep -r "github.com/succinctlabs/sp1" data/projects/
# Returns: (nothing - specific repo not listed)

grep -r "github.com/succinctlabs" data/projects/
# Returns: data/projects/s/succinctlabs.yaml
# (org-level project tracking all succinctlabs repos)
```

**Example 3: Name Variation**

```bash
# Looking for: github.com/defillama/chainlist
find data/projects -name "defillama.yaml"
# Returns: (nothing)

grep -r "github.com/defillama" data/projects/
# Returns: data/projects/d/defi-llama.yaml
# (project name uses hyphenated version)
```

### Systematic Batch Search

When processing multiple GitHub URLs, use this approach:

```bash
# Create a list of repos to search
repos=(
  "ethereum/go-ethereum"
  "argotorg/solidity"
  "defillama/chainlist"
)

# For each repo, search in priority order
for repo in "${repos[@]}"; do
  org=$(echo "$repo" | cut -d'/' -f1)
  echo "Searching for: $repo"

  # Try specific repo first
  result=$(grep -l "github.com/$repo" data/projects/*/*.yaml 2>/dev/null)

  if [ -n "$result" ]; then
    echo "  Found (specific): $result"
  else
    # Try org-level
    result=$(grep -l "github.com/$org\"" data/projects/*/*.yaml 2>/dev/null)
    if [ -n "$result" ]; then
      echo "  Found (org): $result"
    else
      # Try filename
      result=$(find data/projects -name "$org.yaml" 2>/dev/null)
      if [ -n "$result" ]; then
        echo "  Found (filename): $result"
      else
        echo "  NOT FOUND"
      fi
    fi
  fi
done
```

### Important Notes

1. **Always search content first, filenames last**: The project file content is authoritative
2. **Check both specific repos and org-level**: Some projects track individual repos, others track entire orgs
3. **Handle umbrella organizations**: Projects like `a16z-crypto` intentionally aggregate multiple repos that could be standalone
4. **Document your mappings**: Create a mapping file showing which repos map to which projects for transparency
5. **Case sensitivity matters**: Project names and GitHub URLs are case-sensitive

### When Creating Collections from External Lists

When you receive a list of GitHub repositories (e.g., grant recipients, ecosystem projects):

1. **Search systematically** using the priority order above
2. **Track your results** in a mapping file (helpful for debugging)
3. **Identify missing projects** that need to be created
4. **Verify umbrella orgs** - some repos should share a project file, not have individual ones
5. **Ask before splitting** - if repos are under a single org, confirm whether to create org-level or repo-specific projects

## Example Collection File

```yaml
version: 7
name: base-ecosystem
display_name: Base Ecosystem
description: Projects building on Base
projects:
  - aerodrome
  - base-org
  - coinbase
  - morpho-org
  - uniswap
```

## Adding Projects to Existing Collections

If you need to add projects to an existing collection, use the `update-project` skill instead.

## Resources

Within the oss-directory repository:

- Collection schema: `src/resources/schema/collection.json`
- Example collections: `data/collections/`
- All projects: `data/projects/`
