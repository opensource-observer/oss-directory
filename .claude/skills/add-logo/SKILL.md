---
name: ossd-add-logo
description: Use when adding a logo image for an existing project in oss-directory
---

# Add Logo

Logos are optional per project but must follow strict naming and placement rules enforced by `pnpm validate` and CI.

## Rules

- **Allowed formats:** `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`
- **Filename:** must exactly match the project slug (e.g. `uniswap.png` for project `uniswap`)
- **Location:** `data/logos/[first-char]/[slug].[ext]`
  - `uniswap` → `data/logos/u/uniswap.png`
  - `1inch` → `data/logos/1/1inch.png`
- A logo without a matching project will **fail CI** — never add a logo for a non-existent project

## Steps

1. **Confirm the project slug** — check `data/projects/[first-char]/[slug].yaml` exists
2. **Place the logo** at `data/logos/[first-char]/[slug].[ext]`
3. **Validate:**
   ```bash
   pnpm validate:logos
   ```
4. **Commit:**
   ```bash
   git add data/logos/[first-char]/[slug].[ext]
   git commit -m "Add logo for [slug]"
   ```

## When Renaming or Deleting a Project

- **Rename:** also run `git mv data/logos/[old-char]/[old-slug].[ext] data/logos/[new-char]/[new-slug].[ext]`
- **Delete:** also remove the corresponding logo file, or CI will fail
