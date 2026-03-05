---
name: ossd-review-pr
description: Use when reviewing a community pull request to oss-directory — validating schema compliance, naming conventions, blockchain addresses, and running automated checks before merging
---

# Review PR

You help maintainers review community pull requests to the oss-directory repository. This involves checking schema compliance, validating content, and providing constructive feedback.

## When to Use This Skill

Use this skill when:

- Reviewing a community-submitted PR
- Validating changes before merge
- Providing feedback on a submission

Do not use this skill when:

- Creating your own PR (use `add-project` or `add-collection`)
- Making direct commits to main

## Workflow Steps

### 0. Working Directory

All commands assume you're in the oss-directory root. If not already there: `cd ~/GitHub/oss-directory`

### 1. Fetch PR Information

Ask user for PR number or URL, then fetch details:

```bash
gh pr view [PR_NUMBER]
gh pr diff [PR_NUMBER]
```

Or if provided a PR URL like `https://github.com/opensource-observer/oss-directory/pull/937`:

```bash
gh pr view 937
gh pr diff 937
```

Review the output to understand:

- What files are being added/modified
- Type of change (new project, update, collection)
- Author and description

### 2. Checkout PR Branch Locally

```bash
gh pr checkout [PR_NUMBER]
```

This creates a local branch for testing.

### 3. Run Validation and Linting

Run the project's validation tools:

```bash
pnpm run validate
pnpm lint data/projects
```

**Note:** Use `pnpm lint data/projects` to lint only the project files, which is faster than linting the entire repo.

**Common validation errors to watch for:**

- Schema violations (missing required fields)
- Invalid YAML syntax
- References to non-existent projects (in collections)
- Duplicate project/collection names

**If linting fails with formatting issues:**

The linter will show which files have formatting problems:

```
[warn] data/projects/k/kumbaya-xyz.yaml
[warn] Code style issues found in the above file. Run Prettier to fix.
```

Fix formatting automatically:

```bash
pnpm prettier:write data/projects/k/kumbaya-xyz.yaml
# Or fix all files:
pnpm prettier:write
```

Then verify the fix:

```bash
pnpm lint data/projects
```

Common formatting issues:

- Missing newline at end of file
- Incorrect indentation (must be 2 spaces)
- Inconsistent spacing in YAML arrays

### 4. Review Content Quality

**IMPORTANT: Comment Style Guidelines**

When providing feedback, keep comments **concise and specific**:

- ✅ Only mention issues that need fixing
- ❌ Skip table-stakes checks (version 7, basic schema, etc.)
- ❌ Don't include "validation passes ✅" or similar unless it's directly relevant
- Focus on actionable items only

For **new projects**, check:

#### CRITICAL: Project Naming (Most Common Issue)

**This is the #1 issue in PRs.** Always verify:

1. **Check the GitHub URL pattern**:

   - If `github.com/org-name` → name should be `org-name`
   - If `github.com/username/repo-name` → name should be `repo-name-username`

2. **Verify file location matches name**:
   - File must be in `data/projects/[first-char]/[name].yaml`
   - Example: `ethereum` → `data/projects/e/ethereum.yaml`
   - Example: `my-project-alice` → `data/projects/m/my-project-alice.yaml`

**Common naming errors:**

- Using display name instead of GitHub org name
- Not following `[repo-name]-[owner-name]` for single repos
- File in wrong directory

#### Social Field Validation

**Valid social fields** (per schema):

- `twitter`
- `telegram`
- `farcaster`
- `mirror`
- `medium`

**Invalid:**

- ❌ `github` - GitHub URLs go in the top-level `github` field, NOT under `social`

If you see `social.github`, flag this as an error.

#### Blockchain Address Validation

When blockchain addresses are present:

1. **Check etherscan** for mainnet addresses:

   - Visit `https://etherscan.io/address/[address]`
   - If it shows "Contract: Verified" → it's a `contract`, not `eoa`
   - If it has transaction history but no code → it's an `eoa`

2. **Network validation**:

   - ❌ `any_evm` is too vague
   - ✅ Use specific networks: `mainnet`, `optimism`, `base`, `arbitrum`, etc.

3. **Tag accuracy**:
   - Contracts should have `contract` tag
   - EOAs should have `eoa` tag

#### Other Content Checks

- [ ] Description is concise (1-2 sentences) if present
- [ ] No duplicate projects (same GitHub org or name)
- [ ] GitHub URLs are strongly recommended (not required)
- [ ] No test/placeholder data

#### YAML Formatting

- [ ] Proper indentation (2 spaces, not tabs)
- [ ] Arrays use proper YAML list format
- [ ] URLs in quotes if they contain special chars

For **collections**, check:

- [ ] `version: 7` is set
- [ ] All referenced projects exist
- [ ] No duplicate project entries
- [ ] Projects listed alphabetically (recommended)
- [ ] Collection name is meaningful and descriptive

For **updates to existing files**, check:

- [ ] Changes are intentional and described
- [ ] No accidental deletions
- [ ] Still passes validation

### 5. Check for Duplicates

Verify the project/collection doesn't already exist:

```bash
# Search for similar project names
find data/projects -name "*[keyword]*"

# Search for same GitHub org
grep -r "github.com/[org-name]" data/projects/

# List all collections
ls data/collections/
```

If duplicate found:

- Comment on PR explaining the duplicate
- Suggest updating existing entry instead
- Ask if there's a reason for separate entry

### 6. Test Auto-Fix (If Formatting Issues)

If there are only formatting issues (indentation, missing newlines, etc.):

```bash
# Fix specific file
pnpm prettier:write data/projects/[letter]/[project-name].yaml

# Or fix all files
pnpm prettier:write
```

Then re-validate:

```bash
pnpm run validate
pnpm lint data/projects
```

If this fixes all issues, you can apply the fix and approve.

### 7. Provide Feedback or Approve

Based on review, choose action:

#### If Issues Found

Comment on the PR with constructive feedback:

```bash
gh pr comment [PR_NUMBER] --body "Thanks for the submission! I found a few issues:

1. Missing required \`github\` field
2. File should be in \`data/projects/u/\` not \`data/projects/a/\` (name starts with 'u')
3. Description is too long - please keep to 1-2 sentences

Please update and I'll re-review. See docs: https://docs.oso.xyz/docs/projects"
```

Common feedback templates below.

#### If Only Formatting Issues

If only formatting issues that prettier can fix:

```bash
# Apply formatting fix
pnpm prettier:write

# Verify the fix
pnpm lint data/projects

# Check status
git status

# Commit the formatting fix to the PR branch
git add .
git commit -m "Apply formatting fixes"
git push

# Approve the PR
gh pr review [PR_NUMBER] --approve --body "LGTM! Applied formatting fixes."
```

#### If Ready to Merge (Without Blockchain Addresses)

If everything looks good and PR has **no blockchain addresses or DefiLlama URLs**:

```bash
gh pr review [PR_NUMBER] --approve --body "LGTM! Thanks for contributing."

# Optionally merge if you have permission
gh pr merge [PR_NUMBER] --squash
```

#### If Ready but Has Blockchain Addresses (Run /validate)

If everything passes local validation but PR contains **blockchain addresses or DefiLlama URLs**, run automated validation first:

**Step 1: Get the commit SHA**

```bash
gh pr view [PR_NUMBER] --json headRefOid --jq '.headRefOid'
```

**Step 2: Post /validate command**

```bash
gh pr comment [PR_NUMBER] --body "/validate [COMMIT_SHA]"
```

**Example:**

```bash
# Get SHA
gh pr view 937 --json headRefOid --jq '.headRefOid'
# Returns: 66199631fbce097dc4943e117e423eaeafa3f163

# Run validation
gh pr comment 937 --body "/validate 66199631fbce097dc4943e117e423eaeafa3f163"
```

**Step 3: Wait for validation results (2-5 minutes)**

The `oso-prs` bot will post validation results checking:

- Blockchain addresses are valid contracts on specified networks
- DefiLlama URLs are accessible and valid
- EOA, deployer, and safe tags are correct

**Step 4: Review validation results**

If **validation passes (all ✅)**:

```bash
gh pr review [PR_NUMBER] --approve --body "Validation passed! Ready to merge."
gh pr merge [PR_NUMBER] --squash
```

If **validation has errors (❌)**:

```bash
gh pr comment [PR_NUMBER] --body "The automated validation found some issues. Please review the validation results above and fix:

[List specific errors from bot comment]

Once fixed, please push updates and I'll re-run validation."
```

Common validation errors:

- **Address is not a contract**: May be EOA tagged as contract, or wrong network
- **Invalid DefiLlama URL**: Slug doesn't exist or URL is malformed
- **Network mismatch**: Address doesn't exist on specified network

If **only warnings (⚠️)**: Usually acceptable, use judgment whether to merge or request fixes.

**Example validation result** (from PR #902):

```
## Validation Results

⛔ Found 4 errors ⛔

### 0x7f2f35f0c9f9244b1406d1060ac2d0f339ef52e8
- ❌ is not a contract on optimism

### 0x6fee026ae8a76258063c9c67ec78f75b7815d101
- ⚠️ missing validator for wallet on base
- ✅ is a 'deployer' on base
- ✅ is a 'eoa' on base

### https://defillama.com/protocol/super-dca
- ✅ is a valid DefiLlama URL
- ✅ is a valid DefiLlama slug
```

### 8. Cleanup

Switch back to main branch:

```bash
git checkout main
git pull
```

## Project Naming Conventions

**Official Documentation:** https://docs.oso.xyz/docs/projects/#give-your-project-a-unique-name-slug

The `name` field is the **unique identifier** for the project and must match the YAML filename exactly. Most projects follow one of these patterns:

### Pattern 1: GitHub Organization Name (Recommended)

**Use when:** The project has a dedicated GitHub organization.

**Format:** Use the GitHub org name exactly as it appears (lowercase, hyphenated)

**Examples:**

```yaml
# For https://github.com/opensource-observer
name: opensource-observer
# File: data/projects/o/opensource-observer.yaml

# For https://github.com/Uniswap
name: uniswap
# File: data/projects/u/uniswap.yaml
```

### Pattern 2: Monorepo in Larger Organization

**Use when:** The project is a single repo within a larger GitHub org or personal account.

**Format:** `[repo-name]-[owner-name]`

**Examples:**

```yaml
# For https://github.com/my-org/my-repo
name: my-repo-my-org
display_name: My Repo
# File: data/projects/m/my-repo-my-org.yaml
```

### Pattern 3: Collection of Repos (Custom Name)

**Use when:** Project spans multiple repos but you don't want to use the org name.

**Format:** `[project-name]-[distinguisher]`

**Examples:**

```yaml
# For a project with multiple repos:
# - github.com/my-space/projectx-frontend
# - github.com/my-space/projectx-backend
# - github.com/my-space/projectx-docs
name: projectx-my-space
display_name: Project X
# File: data/projects/p/projectx-my-space.yaml
```

This pattern is useful for projects in personal GitHub accounts or across multiple organizations.

### Naming Rules

**Required:**

- ✅ **Globally unique** - No other project can have the same name
- ✅ **Lowercase only** - No uppercase letters
- ✅ **Hyphen-separated** - Use hyphens, not underscores or camelCase
- ✅ **Match filename** - If file is `my-project.yaml`, name must be `my-project`
- ✅ **Match directory** - File goes in folder matching first character of name

**Format Guidelines:**

- ✅ `my-project` - Correct
- ❌ `My-Project` - No uppercase
- ❌ `my_project` - No underscores
- ❌ `myProject` - No camelCase

**Special Cases:**

- **Numbers first:** `0xproject`, `1inch`, `88mph` → Use number as first character
- **Special characters:** Remove them (`$PROJECT` → `project`)
- **Very long names:** Keep concise but descriptive

### Display Name Rules

The `display_name` must also be **globally unique** and is the human-readable name shown in the UI.

**Examples:**

```yaml
name: my-project
display_name: My Project # Can have spaces and capitals
```

### Common Naming Issues

**❌ GitHub URL doesn't match name:**

```yaml
# BAD - org is "my-org" but name is different
name: my-cool-project
github:
  - url: https://github.com/my-org
```

**✅ GitHub org matches name:**

```yaml
# GOOD - name matches org
name: my-org
github:
  - url: https://github.com/my-org
```

**❌ Duplicate name:**

- Check for existing projects first
- Search: `find data/projects -name "*[keyword]*"`
- If conflict exists, choose a different name or verify this is an update

**❌ Name too generic:**

```yaml
name: defi # Too generic, not unique enough
```

**✅ Specific and descriptive:**

```yaml
name: aave # Specific project name
```

## Common Feedback Templates

### Incorrect Project Naming (Most Common)

For GitHub organization:

```
**Incorrect project name**: The project name should match the GitHub organization name.
- **Current**: `name: [wrong-name]`
- **Correct**: `name: [org-name]`
- **File**: `data/projects/[first-char]/[org-name].yaml`

See naming documentation: https://docs.oso.xyz/docs/projects/#give-your-project-a-unique-name-slug
```

For single repository:

```
**Incorrect project name**: Since this is a single repository (not a GitHub organization), the name should follow the pattern `[repo-name]-[owner-name]`:
- **Current**: `name: [current-name]`
- **Correct**: `name: [repo-name]-[owner-name]`
- **File**: `data/projects/[first-char]/[repo-name]-[owner-name].yaml`

The `display_name` can remain `[Display Name]`.

See naming documentation: https://docs.oso.xyz/docs/projects/#give-your-project-a-unique-name-slug
```

### Invalid Social Field

```
**Invalid social field**: The `social` section contains a `github:` field, which is not valid. GitHub URLs belong in the top-level `github` field, not under `social`.

Valid social fields are: `twitter`, `telegram`, `farcaster`, `mirror`, `medium`

Please remove:
\`\`\`yaml
social:
  github:
    - url: [url]
\`\`\`
```

### Blockchain Address Issues

```
**Blockchain address corrections**: I checked [etherscan](https://etherscan.io/address/[address]) and this is a verified contract (not an EOA). Please update:
\`\`\`yaml
blockchain:
  - address: "[address]"
    networks:
      - mainnet  # or specific network
    tags:
      - contract
\`\`\`
```

### Duplicate Project

```
This project appears to already exist in the directory:
- Existing: `data/projects/[x]/[existing-name].yaml`

If this is a different project, please use a unique name. Otherwise, consider updating the existing entry instead.
```

### Formatting Issues

```
There are YAML formatting issues. Please run:

\`\`\`bash
pnpm prettier:write
\`\`\`

Then verify the fix:

\`\`\`bash
pnpm lint data/projects
\`\`\`

Then commit the changes.
```

### GitHub URL Invalid

```
The GitHub URL appears to be invalid or inaccessible:
- `[url]`

Please verify the URL is correct and points to an active repository or organization.
```

### Description Too Long

```
**Description is too long**: Please condense to 1-2 sentences.
```

### YAML Syntax Issues

```
**Incomplete YAML syntax**: The file has issues with [specific issue]. Please fix the YAML formatting.
```

## Review Checklist

Use this checklist for each PR (in priority order):

### CRITICAL CHECKS (Most Common Issues)

1. **Project Naming** (check FIRST):

   - [ ] GitHub org URL → name matches org
   - [ ] Single repo URL → name follows `[repo-name]-[owner-name]`
   - [ ] File location is `data/projects/[first-char]/[name].yaml`
   - [ ] Filename matches `name` field exactly

2. **Social Field Validation**:

   - [ ] No `github` under `social` (GitHub goes in top-level `github` field)
   - [ ] Only valid social fields: twitter, telegram, farcaster, mirror, medium

3. **Blockchain Addresses** (if present):
   - [ ] Check etherscan for contract vs EOA
   - [ ] Specific network names (not `any_evm`)
   - [ ] Correct tags (`contract` vs `eoa`)

### Other Content Checks

- [ ] No duplicate projects (same GitHub org or name)
- [ ] Description is 1-2 sentences (if present)
- [ ] YAML syntax is valid (no incomplete fields)
- [ ] No test/spam data

### Validation

- [ ] `pnpm run validate` passes
- [ ] `pnpm lint` passes
- [ ] If PR has blockchain addresses or DefiLlama URLs, run `/validate` command

## When to Request Changes

Request changes if (in priority order):

**Critical Issues:**

- Incorrect project naming (wrong pattern or file location)
- Invalid `social.github` field
- Invalid blockchain address tags or networks
- Duplicate project/collection
- Invalid YAML syntax

**Other Issues:**

- Description too long (>2 sentences)
- Missing strongly recommended fields (e.g., GitHub URL)
- Contains test/spam data
- Validation fails

## When to Approve

Approve if:

- All required fields present
- Passes validation and linting
- No duplicates
- Content is appropriate
- Formatting is correct (or you've fixed it)

## Advanced: GitHub CLI Commands

List all open PRs:

```bash
gh pr list --limit 20
```

View PR files:

```bash
gh pr view [PR_NUMBER] --json files --jq '.files[].path'
```

Add reviewers:

```bash
gh pr edit [PR_NUMBER] --add-reviewer @username
```

Add labels:

```bash
gh pr edit [PR_NUMBER] --add-label "needs-work"
```

Close PR:

```bash
gh pr close [PR_NUMBER] --comment "Closing due to [reason]"
```

## Resources

- PR Queue: https://github.com/opensource-observer/oss-directory/pulls
- Contributing docs: https://docs.oso.xyz/docs/projects

Within the oss-directory repository:

- Project schema: `src/resources/schema/project.json`
- Collection schema: `src/resources/schema/collection.json`
