---
name: ossd-enrich-collection
description: Enrich project metadata (display names, descriptions, websites, Twitter) for a list of projects — from a collection file, explicit slug list, or glob pattern. Dispatches parallel subagents to research each project via GitHub and web search.
---

# Enrich Collection

Enrich project metadata for a batch of projects in oss-directory. Focuses on four fields: `display_name`, `description`, `websites`, and `social.twitter`. Does NOT touch `name`, filenames, `github`, `blockchain`, `npm`, or any other artifact fields.

## When to Use

- A collection has sparse project files (missing descriptions, websites, twitter)
- You want to bring a set of projects up to a baseline quality level
- After bulk-importing projects that only have name + GitHub

## Input Formats

The user can provide projects in any of these ways:

1. **Collection path**: `data/collections/filecoin-onramps.yaml` — reads the `projects` list from the file
2. **Explicit slug list**: `enrich projects: akave-ai, storacha, pinatacloud`
3. **Glob pattern**: `data/projects/f/fil*.yaml` — resolves matching filenames to slugs

Parse whichever format into a list of project slugs. Everything downstream is the same.

## Workflow

### Phase 1 — Inventory

1. **Resolve project list** from the user's input (collection, slugs, or glob)
2. **Read each project YAML** and catalog the current state of enrichable fields:
   - `display_name` (always present, but may be improvable)
   - `description` (often missing)
   - `websites` (often missing)
   - `social.twitter` (often missing)
3. **Check git history** for recent edits (last 30 days) to any of these four fields:
   ```bash
   git log --since="1 month ago" -p -- data/projects/<char>/<slug>.yaml
   ```
   Grep the diff output for changes to `display_name`, `description`, `websites`, or `twitter`. Flag any project where these fields were recently touched. This is informational only — enrichment still proceeds, but the summary will note which projects had recent edits.
4. **Print inventory table** showing each project, which fields are present/missing, and any recent-edit flags.

### Phase 2 — Research (batches of 10)

5. **Dispatch subagents** in batches of up to 10, one per project, running in parallel. Each subagent:

   - Receives the project slug, current YAML content, and GitHub org URL (if present)
   - Uses **WebSearch** and **WebFetch** to find:
     - Official website URL
     - Twitter/X handle and URL
     - A concise description (1-2 sentences describing what the project does)
     - Correct display name (proper casing, current branding)
   - Returns a structured result (not raw research notes)

6. **Subagent prompt template:**

   ```
   Research the open source project "[slug]" for oss-directory enrichment.

   Current YAML:
   ---
   [paste current YAML content]
   ---

   Your task:
   1. If the project has a GitHub org URL above, start by searching for the project's
      official website, Twitter/X account, and a description of what they do.
   2. If no GitHub URL, search the web for "[display_name] open source project" or
      "[slug] crypto/web3 project" to find the project.
   3. Find the project's official website (not GitHub). Look for a homepage, docs site,
      or landing page.
   4. Find their Twitter/X handle. Check the GitHub org profile, website footer/header,
      or search directly.
   5. Write a 1-2 sentence description of what the project does. Be factual and concise.
      Do not use marketing language.
   6. Check if the display name uses correct casing and current branding (companies rebrand).

   Return your findings in EXACTLY this format (valid YAML):

   display_name: "<corrected display name or UNCHANGED if current is fine>"
   description: "<1-2 sentence description or UNCHANGED if current is good>"
   websites:
     - <url1>
   twitter:
     - <twitter url>
   notes: "<any relevant context, e.g. 'company rebranded from X to Y', or 'no Twitter found'>"

   Rules:
   - All URLs must include https:// protocol
   - Twitter URLs should use https://x.com/<handle> format
   - Website URLs should be the project homepage, not GitHub
   - If you cannot find a field, omit it from the output
   - Use "UNCHANGED" for display_name or description only if the current value is already good
   - Do not invent or guess — only report what you can verify
   ```

7. **Wait for batch to complete**, then dispatch next batch. Continue until all projects are researched.

### Phase 3 — Apply

8. **Parse subagent results** and for each project:

   - `display_name`: overwrite with researched value (unless "UNCHANGED")
   - `description`: overwrite with researched value (unless "UNCHANGED")
   - `websites`: append any new URLs not already present (deduplicate by domain)
   - `social.twitter`: append any new URLs not already present (deduplicate by handle)

9. **Edit each project YAML** using the Edit tool. Preserve all existing fields not being enriched. Follow this field order in the YAML:

   ```yaml
   version: 7
   name: <slug>
   display_name: <display name>
   description: <description>
   websites:
     - url: <website>
   social:
     twitter:
       - url: <twitter url>
   github:
     - url: <github url>
   # ... remaining fields unchanged
   ```

10. **Run validation:**

    ```bash
    pnpm run validate
    pnpm prettier:write
    ```

11. **Show summary** with:
    - Table of changes per project (what was added/updated)
    - Flag any projects with recent git edits to enriched fields
    - Any projects where research found nothing new
    - The git diff for review

## Important Rules

- **Never modify `name` or rename files** — this skill only enriches metadata
- **Never touch artifact fields** (`github`, `npm`, `blockchain`, `crates`, `go`, `open_collective`, `defillama`)
- **Never touch `version`** — leave as-is
- **Deduplicate URLs** — before appending, check if the URL (or a variant like http vs https, www vs non-www) already exists
- **Twitter URL format** — use `https://x.com/<handle>` for new entries
- **Website URL format** — always include `https://` protocol
- **Don't commit** — show the diff and let the user decide when to commit
- **Batch size is 10** — never dispatch more than 10 subagents at once

## Example Usage

```
# From a collection
/enrich-collection data/collections/filecoin-onramps.yaml

# From explicit slugs
/enrich-collection akave-ai, storacha, pinatacloud, lighthouse-web3

# From glob
/enrich-collection data/projects/a/a*.yaml
```

## Example Output

```
## Inventory (13 projects from filecoin-onramps)

| Project          | display_name | description | websites | twitter | recent edits |
|------------------|:---:|:---:|:---:|:---:|:---|
| 4everland        | yes | no  | no  | no  | |
| akave-ai         | yes | no  | no  | no  | |
| lighthouse-web3  | yes | yes | yes | yes | description (2d ago) |
| pinatacloud      | yes | no  | no  | no  | |
| storacha         | yes | no  | no  | no  | |
...

## Enrichment Results

| Project          | display_name | description | websites | twitter | notes |
|------------------|---|---|---|---|---|
| 4everland        | UNCHANGED | Added | +1 url | +1 url | |
| akave-ai         | UNCHANGED | Added | +1 url | +1 url | |
| lighthouse-web3  | UNCHANGED | UNCHANGED | UNCHANGED | UNCHANGED | already enriched |
| pinatacloud      | UNCHANGED | Added | +1 url | +1 url | |
| storacha         | Updated | Added | +1 url | +1 url | rebranded from web3.storage |
...

Recently edited: lighthouse-web3 (description, 2d ago)

[git diff shown below]
```
