---
name: ossd-bulk-update
description: Use when importing or updating many projects at once from external data sources (APIs, JSON, CSV), or building collections from external rankings and lists
---

# Bulk Update Projects

You help maintainers perform bulk updates to the oss-directory using data from external sources like APIs, JSON files, or spreadsheets. This skill handles systematic updates to many projects at once, ensuring data consistency and proper validation.

## When to Use This Skill

Use this skill when:

- Importing/updating projects from external data sources (APIs, JSON, CSV)
- Adding missing metadata to multiple existing projects
- Creating collections based on external rankings or lists (e.g., "Top 50 by TVL")
- Synchronizing oss-directory with external data providers
- Bulk enrichment of project data (adding DefiLlama, npm, blockchain addresses, etc.)

Do not use this skill when:

- Adding a single project (use `add-project` skill)
- Updating a single project (use `update-project` skill)
- Manual one-off updates without external data

## Core Workflow

### 0. Working Directory

All commands assume you're in the oss-directory root. If not already there: `cd ~/GitHub/oss-directory`

### 1. Obtain and Prepare External Data

**Download or fetch the data:**

```bash
# Example: DefiLlama protocols API
curl -o /tmp/protocols_data.json https://api.llama.fi/protocols

# Example: Custom API with authentication
curl -H "Authorization: Bearer $TOKEN" \
  -o /tmp/data.json \
  https://api.example.com/projects

# Example: Using existing file
cp /path/to/data.csv /tmp/input_data.csv
```

**Understand the data structure:**

- Read the file to understand field mappings
- Identify unique identifiers (slugs, GitHub URLs, etc.)
- Note which fields map to oss-directory schema fields

### 2. Plan the Bulk Update

Create a task list to track progress using `TaskCreate` for each step:

- Download and analyze external data source
- Map external data to oss-directory projects
- Create new projects for missing entries
- Update existing projects with new data
- Validate all changes
- Commit changes

**Update tasks as you progress** — set `in_progress` when starting, `completed` when done.

### 3. Create Systematic Mapping

Map external data identifiers to oss-directory project names:

**Strategy A: Use GitHub URLs**

```bash
# Extract GitHub org from external data
cat /tmp/data.json | jq -r '.[] | select(.github != null) | .github' | \
  sed 's|https://github.com/||' | sed 's|/.*||' > /tmp/github_orgs.txt

# Check which exist in oss-directory
while read org; do
  if find data/projects -name "$org.yaml" -type f 2>/dev/null | grep -q .; then
    echo "EXISTS: $org"
  else
    echo "MISSING: $org"
  fi
done < /tmp/github_orgs.txt
```

**Strategy B: Use name/slug mapping**

```bash
# Create mapping file
cat /tmp/data.json | jq -r '.[] | "\(.slug),\(.github)"' > /tmp/mapping.csv

# Search for existing projects by slug
cat /tmp/mapping.csv | while IFS=, read slug github; do
  # Try exact match
  if find data/projects -name "$slug.yaml" | grep -q .; then
    echo "MATCH: $slug"
  else
    # Try fuzzy match
    find data/projects -name "*$slug*.yaml"
  fi
done
```

**Strategy C: Manual mapping for complex cases**

```bash
# Log all mappings to a file for review
echo "external_id,oss_directory_name,action,notes" > /tmp/bulk_mapping.csv
# Fill this in as you process each entry
```

### 4. Process Each Entry Systematically

**For each item in the external data:**

#### Step A: Determine if project exists

```bash
# Check by GitHub org
find data/projects -name "[org-name].yaml"

# Check by slug/name
find data/projects -name "[slug].yaml"

# Grep for GitHub URL
grep -r "github.com/[org-name]" data/projects/
```

#### Step B: If project exists → Update it

```bash
# Read current project file
cat data/projects/[letter]/[project-name].yaml

# Use Edit tool to add/update fields:
# - defillama URLs
# - npm packages
# - blockchain addresses
# - social media
# - websites
```

#### Step C: If project doesn't exist → Create it

```bash
# Determine project name from GitHub org (preferred)
# File path: data/projects/[first-letter]/[project-name].yaml

# Create minimal valid project:
version: 7
name: [project-name]
display_name: [Display Name]
description: [1-2 sentence description]
websites:
  - url: [website-url]
github:
  - url: https://github.com/[org-name]
[additional-fields-from-data]
```

**CRITICAL RULES:**

- ✅ **GitHub org URLs only** - Use `https://github.com/org-name` NOT `https://github.com/org-name/repo-name`
- ✅ **Match project name to GitHub org** - If org is `babylonlabs-io`, name must be `babylonlabs-io`
- ✅ **Validate external URLs** - Test that URLs work before adding (especially CEX vs protocol URLs)
- ✅ **Comment out invalid URLs** - Don't remove data, comment it out for future reference
- ✅ **Log all mappings** - Keep track of what you're doing in `/tmp/mapping_log.txt`

### 5. Manual Research Strategy (When No API Available)

When building a collection without an API (e.g., "Top 50 Banks"):

#### Step A: Search by Category

```bash
# Instead of searching for individual companies, search by industry category:
# - "fintech neobanks GitHub organization"
# - "insurance companies GitHub organization"
# - "credit bureaus GitHub organization"
# - "investment firms GitHub organization"
```

Use web searches to:

1. Identify companies in each category
2. Find their GitHub organizations
3. Verify they have meaningful open source presence (public repos, not just private orgs)

#### Step B: Verify GitHub Presence

```bash
# Not all major companies have usable GitHub orgs. Check:
# ✓ Does the GitHub org have public repositories?
# ✓ Are there 3+ public repos with meaningful content?
# ✓ Is it the official org (not third-party or fan accounts)?

# Examples of companies WITHOUT useful public GitHub orgs:
# - Wells Fargo (private org, no public repos)
# - E*TRADE (no official org found)
# - DBS Bank (no official org found)
# - OCBC Bank (no official org found)
```

Skip companies that don't have public GitHub presence - they don't belong in oss-directory.

#### Step C: Handle Multiple Orgs per Institution

Many large institutions have multiple related GitHub organizations:

```yaml
# Example: Experian
github:
  - url: https://github.com/experianplc      # Main org (23 repos)
  - url: https://github.com/experiandataquality  # Division/product org

# Example: MetLife
github:
  - url: https://github.com/MetLife           # Corporate (6 repos)
  - url: https://github.com/MetLifeLegalPlans # Subsidiary (25 repos)

# Example: TransUnion
github:
  - url: https://github.com/transunion        # Main org
  - url: https://github.com/Trustev           # Acquisition
  - url: https://github.com/iovation          # Global Fraud Solutions
```

**When to include multiple orgs:**

- Different divisions/products of same company
- Acquisitions that maintained separate GitHub presence
- Regional/business unit organizations

**When NOT to include:**

- Personal repos of employees
- Third-party integrations
- Unrelated projects with similar names

#### Step D: GitHub Org Naming Variations

GitHub org names don't always match company names exactly:

| Company    | GitHub Org     | Reason                     |
| ---------- | -------------- | -------------------------- |
| Wise       | `transferwise` | Former company name        |
| Chime      | `1debit`       | Technical/corporate entity |
| Vanguard   | `Vanguard-oss` | Dedicated OSS org          |
| Xero       | `xeroapi`      | Developer/API focused org  |
| State Farm | `StateFarmIns` | Abbreviated form           |

**How to find the correct org:**

1. Check company's developer portal or open source page
2. Search: "[Company Name] GitHub organization"
3. Look for mentions in blog posts or job postings
4. Check repos for official branding/copyright

#### Step E: Description Standards for Manual Entries

When creating descriptions for manually researched projects:

```yaml
# Include these elements:
description: [Company Type] is a/an [Nationality] [Industry] company providing [Services]. [Company] has [N] repositories on GitHub [notable projects if known]

# Examples:

# With repo count and notable projects:
description: State Farm Mutual Automobile Insurance Company is an American insurance and financial services company providing insurance and financial services. State Farm has 175 repositories on GitHub including CLAWS, TheThingStore, and Terraform modules

# With repo count only:
description: Wise (formerly TransferWise) is a British financial technology company providing international money transfer services and multi-currency accounts. Wise has 224 repositories on GitHub with open source tools and libraries

# With general description (when repo count unavailable):
description: Nubank is a Brazilian neobank and financial technology company providing banking services, credit cards, and personal loans through mobile applications. Nubank has extensive GitHub presence with open source projects including fklearn and other machine learning tools
```

**Where to get repo counts:**

- GitHub org page shows public repository count
- Can be found via GitHub API: `https://api.github.com/orgs/[org-name]`

#### Step F: Category-Based Target Completion

When working toward a specific collection size (e.g., "Top 50"):

**Strategy:**

1. Start with obvious/largest companies in core category
2. Track progress toward goal (e.g., 32/50)
3. Expand to adjacent categories systematically
4. Search by category, not individual companies

**Example progression for "Top 50 TradFi":**

- Start: Top 10 US banks → 10 projects
- Round 1: More US banks + payment processors → 17 projects
- Round 2: European banks + fintech → 26 projects
- Round 3: Neobanks + financial software → 32 projects
- Round 4: Insurance companies → 38 projects
- Round 5: Credit bureaus + remaining → 50 projects ✓

**Categories to consider for financial institutions:**

- Traditional banks (retail, commercial, investment)
- Neobanks/digital banks (Monzo, Nubank, Chime)
- Payment processors (Stripe, Adyen, Square)
- Fintech platforms (Plaid, Wise, Robinhood)
- Investment firms (Vanguard, BlackRock, Fidelity)
- Insurance companies (AIG, MetLife, State Farm, Liberty Mutual)
- Credit bureaus (Equifax, Experian, TransUnion)
- Financial software (Xero, Intuit, Bloomberg)

### 6. Handle Special Cases

#### DefiLlama URLs (CEX vs Protocol)

DefiLlama has two URL patterns that cannot be mixed:

- **Protocol URLs**: `https://defillama.com/protocol/[slug]` - Valid in schema
- **CEX URLs**: `https://defillama.com/cex/[slug]` - NOT valid in schema (comment out)

```yaml
# CEXs (centralized exchanges) - comment out the /cex/ URL
defillama:
  # - url: https://defillama.com/cex/binance  # Not valid in schema
  - url: https://defillama.com/protocol/binance-staked-eth  # Valid protocol URL

# Protocols - use /protocol/ URLs
defillama:
  - url: https://defillama.com/protocol/uniswap-v3
  - url: https://defillama.com/protocol/uniswap-v2
```

**How to check:** Look for `category: "CEX"` field in the data source.

#### Blockchain Addresses

Validate tags before adding:

```bash
# Check on Etherscan
curl "https://etherscan.io/address/0x..."

# If it's a contract, use tags: [contract]
# If it's an EOA, use tags: [eoa]
# If it's a deployer, use tags: [deployer]
```

```yaml
blockchain:
  - address: "0x1234567890123456789012345678901234567890"
    networks:
      - mainnet # Use specific network, NOT "any_evm"
    tags:
      - contract # or: eoa, deployer, safe, wallet
```

#### Multiple Protocols per Project

Some projects have multiple protocols under one GitHub org:

```yaml
# Example: Hyperliquid has multiple protocols
defillama:
  - url: https://defillama.com/protocol/hyperliquid-bridge
  - url: https://defillama.com/protocol/hyperliquid-hlp
  - url: https://defillama.com/protocol/hyperliquid-spot-orderbook
  - url: https://defillama.com/protocol/hyperliquid-perps
```

**Check the data source** for all protocols associated with the same GitHub org.

### 7. Validation Strategy

**Incremental validation** - Don't wait until the end:

```bash
# After every 10-20 updates, validate
pnpm run validate

# If errors, fix immediately
# Common issues:
# - Empty defillama arrays (remove entire section or comment it out)
# - Duplicate YAML keys (merge them)
# - Invalid URLs (fix or comment out)
# - Wrong indentation (run pnpm prettier:write)
```

**Batch Processing Strategy:**
When creating many files manually:

1. Create 5-10 project files
2. Run `pnpm run validate` to catch errors early
3. Fix any issues immediately
4. Continue with next batch
5. Commit every 10-20 successful files to avoid losing work

**Collection Alphabetical Sorting:**
Collections MUST have projects in alphabetical order:

```yaml
# ✓ CORRECT - Alphabetically sorted
projects:
  - aave
  - babylonlabs-io
  - binance
  - compound

# ✗ WRONG - Not alphabetically sorted
projects:
  - compound
  - aave
  - binance
  - babylonlabs-io
```

The validation will pass even if unsorted, but it's required by convention. When updating a collection with new projects:

1. Add all new project names to the list
2. Re-sort the entire list alphabetically
3. Verify the count matches your goal (e.g., 50 projects)

**Pro tip:** Use shell to verify alphabetical order:

```bash
# Check if collection is alphabetically sorted
cat data/collections/your-collection.yaml | \
  grep "^  - " | \
  sort -c 2>&1 && echo "✓ Sorted" || echo "✗ Not sorted"
```

**Final validation:**

```bash
pnpm run validate
pnpm lint
pnpm build
pnpm test
```

### 8. Create/Update Collection (If Applicable)

If the bulk update is for a specific list/ranking:

```yaml
# Example: data/collections/defillama-top-50-protocols.yaml
version: 7
name: defillama-top-50-protocols
display_name: DefiLlama Top 50 Protocols
description: Top 50 DeFi protocols by TVL from DefiLlama API
projects:
  - aave
  - babylonlabs-io
  - binance
  # ... (alphabetically sorted)
```

### 9. Commit Strategy

**Option A: Single commit (for smaller bulk updates)**

```bash
git add data/projects/ data/collections/
git commit -m "Bulk update: Add DefiLlama URLs to 50 DeFi projects

- Created 10 new project files
- Updated 40 existing projects with DefiLlama URLs
- Added defillama-top-50-protocols collection

Data source: DefiLlama API (api.llama.fi/protocols)
"
```

**Option B: Multiple commits (for large/complex updates)**

```bash
# Commit 1: New projects
git add data/projects/*/[new-projects].yaml
git commit -m "Add 10 new DeFi projects from DefiLlama top 50"

# Commit 2: Update existing
git add data/projects/*/[updated-projects].yaml
git commit -m "Add DefiLlama URLs to 40 existing projects"

# Commit 3: Collection
git add data/collections/defillama-top-50-protocols.yaml
git commit -m "Add DefiLlama top 50 protocols collection"
```

**Include in commit message:**

- What was updated
- How many projects affected (created vs updated)
- Data source and date
- Any caveats or known issues

## Common Data Sources

### DefiLlama API

```bash
# All protocols
curl https://api.llama.fi/protocols > /tmp/defillama_protocols.json

# Mappings to explore:
# - slug → project name
# - github → GitHub org
# - url → DefiLlama protocol URL
# - category → "CEX" or protocol type
# - tvl → Total Value Locked (for ranking)
```

### GitHub API (for org/repo data)

```bash
# Get org info
curl https://api.github.com/orgs/[org-name]

# List org repos
curl https://api.github.com/orgs/[org-name]/repos
```

### CSV/Spreadsheet Data

```bash
# Convert CSV to JSON for easier processing
cat data.csv | \
  jq -R 'split(",")' | \
  jq -s 'map({name: .[0], github: .[1], website: .[2]})'
```

## Error Handling Patterns

### Duplicate Projects Found

```bash
# If you find an existing project during bulk import
# Check if it's truly a duplicate or should be merged

# Option 1: Update existing project with new data
# Option 2: Skip if data already exists
# Option 3: Merge if different data sources

# Log the decision:
echo "Skipped [external-id]: Already exists as [oss-project-name]" >> /tmp/skipped.log
```

### Invalid or Missing GitHub URLs

```yaml
# If GitHub URL is missing from external data but you find it:
# Add it manually and document:

# Missing in API, found manually: https://github.com/[org]
github:
  - url: https://github.com/[org]
```

### Validation Failures

```bash
# Common fixes:

# 1. Empty arrays (defillama with only commented URLs)
# Remove the entire section or ensure at least one valid URL

# 2. Duplicate keys in YAML
# Merge the duplicate sections

# 3. Invalid URLs
# Test each URL and comment out ones that 404

# 4. Wrong schema fields
# Check src/resources/schema/project.json for valid fields
```

## Best Practices

### 1. Work Incrementally

- Process data in batches of 10-20 projects
- Validate after each batch
- Commit working batches before moving to next

### 2. Keep Audit Trails

```bash
# Log everything you do
echo "$(date): Started processing DefiLlama top 50" >> /tmp/bulk_update.log
echo "Created: babylonlabs-io.yaml (rank #2, $71B TVL)" >> /tmp/bulk_update.log
echo "Updated: aave.yaml - added DeFiLlama URLs" >> /tmp/bulk_update.log
```

### 3. Document Edge Cases

```yaml
# In commit messages or as YAML comments:

# Comment in YAML:
# Note: CEX URL not valid in schema, commented out as of 2025-01
defillama:
  # - url: https://defillama.com/cex/binance
# In commit message:
# Note: 5 projects missing GitHub orgs were not added to collection
```

### 4. Verify External Data Quality

```bash
# Before trusting external data, spot-check it:

# Check if GitHub URLs are valid
cat /tmp/data.json | jq -r '.[].github' | head -5 | while read url; do
  curl -I "$url" 2>&1 | grep -q "200 OK" && echo "✓ $url" || echo "✗ $url"
done

# Check if websites are live
cat /tmp/data.json | jq -r '.[].website' | head -5 | while read url; do
  curl -I "$url" 2>&1 | grep -q "200 OK" && echo "✓ $url" || echo "✗ $url"
done
```

### 5. Update Tasks Throughout

Update your task list after completing each major step:

- Mark tasks completed immediately using `TaskUpdate`
- Add new tasks with `TaskCreate` if you discover issues
- Keep only one task `in_progress` at a time

## Examples: Complete Bulk Update Workflows

### Example 1: Import Top 50 DeFi Protocols from DefiLlama (API-Based)

**1. Fetch data**

```bash
curl https://api.llama.fi/protocols > /tmp/defillama_protocols.json
```

**2. Create task list** (using `TaskCreate` for each step)

```
- Download DefiLlama API data
- Map top 50 protocols to oss-directory
- Create missing projects
- Update existing projects
- Create collection
- Validate all changes
- Commit
```

**3. Analyze and map**

```bash
# Get top 50 by TVL
cat /tmp/defillama_protocols.json | \
  jq 'sort_by(-.tvl) | .[0:50] | .[] | {slug, name, github, tvl}' > /tmp/top50.json

# Check which exist
cat /tmp/top50.json | jq -r '.github' | while read gh; do
  org=$(echo $gh | sed 's|https://github.com/||' | cut -d'/' -f1)
  find data/projects -name "$org.yaml" | grep -q . && echo "EXISTS: $org" || echo "NEW: $org"
done
```

**4. Process systematically**

```bash
# For each of the 50:
# - If exists: Use Edit to add defillama URLs
# - If missing: Use Write to create new project file
# - Log each action
```

**5. Create collection**

```yaml
# data/collections/defillama-top-50-protocols.yaml
version: 7
name: defillama-top-50-protocols
display_name: DefiLlama Top 50 Protocols
description: Top 50 DeFi protocols by TVL
projects:
  - [all-50-project-names-alphabetically]
```

**6. Validate incrementally**

```bash
# After every 10 projects
pnpm run validate
```

**7. Commit**

```bash
git add data/projects/ data/collections/defillama-top-50-protocols.yaml
git commit -m "Add DefiLlama Top 50 Protocols

- Created 10 new projects
- Updated 40 existing projects with DefiLlama URLs
- Collection tracks top 50 DeFi protocols by TVL
- Data source: api.llama.fi/protocols (2025-01-19)
"
```

### Example 2: Build Top 50 TradFi Collection (Manual Research)

**Scenario:** Create collection of 50 traditional finance institutions with GitHub presence

**1. Create task list** (using `TaskCreate` for each step)

```
- Search for fintech companies (Wise, SoFi, Monzo, Chime)
- Search for insurance companies
- Search for credit bureaus
- Search for investment firms
- Create all project files
- Update collection to 50
- Validate and commit
```

**2. Research by category**

```bash
# Search: "Wise TransferWise GitHub organization"
# Found: github.com/transferwise (224 repos)

# Search: "Monzo bank GitHub organization"
# Found: github.com/monzo (174 repos)

# Search: "Chime bank GitHub organization"
# Found: github.com/1debit (47 repos)

# Search: "State Farm GitHub organization"
# Found: github.com/StateFarmIns (175 repos)

# For each: Verify public repos exist and are meaningful
```

**3. Track progress toward goal**

```bash
# After fintech batch: 32 → 36 (need 14 more)
# After insurance batch: 36 → 42 (need 8 more)
# After credit bureaus: 42 → 45 (need 5 more)
# After investment firms: 45 → 50 ✓
```

**4. Create files in batches**

```bash
# Batch 1: Create 5 fintech projects
# Validate: pnpm run validate
# Batch 2: Create 6 insurance projects
# Validate: pnpm run validate
# Continue until 50 projects created
```

**5. Create project files with standard format**

```yaml
# Example: Wise
version: 7
name: wise
display_name: Wise
description: Wise (formerly TransferWise) is a British financial technology company providing international money transfer services and multi-currency accounts. Wise has 224 repositories on GitHub with open source tools and libraries
websites:
  - url: https://wise.com
github:
  - url: https://github.com/transferwise
social:
  twitter:
    - url: https://twitter.com/Wise
```

**6. Update collection (alphabetically sorted)**

```yaml
# data/collections/tradfi-top-50-banks.yaml
version: 7
name: tradfi-top-50-banks
display_name: Traditional Finance Institutions
description: Traditional financial services institutions including banks, investment banks, asset managers, payment processors, and fintech companies with active open source projects on GitHub
projects:
  - adyen
  - affirm
  - aig
  - ally
  # ... (all 50 in alphabetical order)
  - wise
  - xero
```

**7. Commit**

```bash
git add data/projects/ data/collections/tradfi-top-50-banks.yaml
git commit -m "Complete TradFi Top 50 collection with 18 new institutions

Added 18 new traditional finance institutions to reach 50 total:

Fintech & Neobanks:
- Wise (224 repos), Monzo (174 repos), Nubank, Chime (47 repos)

Investment & Trading:
- Vanguard, Interactive Brokers, Bloomberg

Insurance:
- State Farm (175 repos), Liberty Mutual (53 repos), AIG, MetLife, Prudential, Nationwide

Credit Bureaus:
- Equifax, Experian (23 repos), TransUnion

Collection includes banks, investment firms, insurance, credit bureaus,
payment processors, and fintech - all with verified GitHub presence.
"
```

**Key differences from API-based workflow:**

- No API to fetch - must manually research each company
- Search by category/industry instead of ranking API
- Verify each GitHub org exists and is public before creating
- Handle org naming variations (Wise→transferwise, Chime→1debit)
- Track progress toward numerical goal (50 projects)
- Include repo counts in descriptions when available

## Troubleshooting

### Problem: Too many validation errors

**Solution:** Process in smaller batches. Fix errors immediately rather than batching fixes.

### Problem: Unclear how to map external IDs to project names

**Solution:** Use multiple strategies:

1. Check GitHub URL first (most reliable)
2. Try slug/name exact match
3. Try fuzzy search on display names
4. Ask user for manual mapping file

### Problem: External data has fields not in schema

**Solution:**

- Check `src/resources/schema/project.json` for valid fields
- Add only supported fields
- Log unsupported fields for potential future schema additions

### Problem: GitHub orgs vs repos confusion

**Solution:**

- Always prefer org-level URLs: `https://github.com/org-name`
- Only use repo URLs if project has no org
- Never mix org and repo URLs unless they're different orgs

### Problem: Commit is too large

**Solution:**

- Break into multiple commits by category:
  - New projects
  - Updated existing projects
  - Collections
  - Fixes/corrections

## Resources

- oss-directory docs: https://docs.oso.xyz/docs/projects
- Project schema: `src/resources/schema/project.json`
- Collection schema: `src/resources/schema/collection.json`
- Example bulk updates: Search git log for "bulk", "import", "add.\*protocols"

## Related Skills

- `add-project` - For adding individual projects
- `update-project` - For updating individual projects
- `add-collection` - For creating collections
- `review-pr` - For reviewing community contributions
