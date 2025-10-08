//!/usr/bin/env -S node
/**
 * Generate a human-readable Markdown page from local JSON Schemas.
 * How: read {project.json, collection.json}, build one page with overview,
 * quick example JSON, properties table, and expanded nested sections.
 * Why: the default generators are hard to scan; this aims for clarity.
 */

import * as fs from "node:fs";
import * as path from "node:path";

type Dict<T = unknown> = Record<string, T>;
type Schema = {
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Dict<Schema>;
  required?: string[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  items?: Schema;
  enum?: unknown[];
  example?: unknown;
  examples?: unknown[];
  default?: unknown;
  $ref?: string;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalProperties?: boolean | Dict;
  $defs?: Dict<Schema>;
  definitions?: Dict<Schema>;
  [k: string]: unknown;
};

const DEFAULT_SCHEMA_DIR = "src/resources/schema";
const DEFAULT_OUT = "docs/oss-directory-schema.md";
const DEFAULT_SCHEMAS = ["project", "collection"] as const;

type Args = { schemaDir: string; out: string; schemas: string[] };

/** Minimal CLI parsing to keep the script dependency-free. */
function parseArgs(argv: string[]): Args {
  const out: Args = { schemaDir: DEFAULT_SCHEMA_DIR, out: DEFAULT_OUT, schemas: [...DEFAULT_SCHEMAS] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--schemaDir") out.schemaDir = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--schemas") out.schemas = argv[++i].split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  }
  return out;
}

/** Read a local schema. Fail early if it is missing. */
function loadJson(p: string): Schema {
  if (!fs.existsSync(p)) throw new Error(`Schema not found: ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8")) as Schema;
}

/** Escape special chars so Markdown tables render correctly. */
function escapeMd(s: unknown): string {
  const t = String(s ?? "");
  return t.replace(/\|/g, "\\|").replace(/`/g, "\\`").replace(/\r?\n/g, " ");
}

/** Convert a JSON Schema "type" to a concise display form. */
function jsonType(t: unknown): string {
  if (Array.isArray(t)) return t.map(String).join(" | ");
  return t ? String(t) : "object";
}

/** Normalize property types, including unions and arrays. */
function typeString(p?: Schema): string {
  if (!p || typeof p !== "object") return "object";
  if (Array.isArray(p.anyOf)) return p.anyOf!.map(typeString).join(" | ");
  if (Array.isArray(p.oneOf)) return p.oneOf!.map(typeString).join(" | ");
  const t = p.type;
  if (t === "array") {
    const it = p.items;
    const base = it && (it.type ? jsonType(it.type) : "object");
    return `${base ?? "object"}[]`;
  }
  if (Array.isArray(t)) return t.map(jsonType).join(" | ");
  if (typeof t === "string") return jsonType(t);
  return "object";
}

/** Summarize constraints in short notes so readers don't hunt through JSON. */
function constraints(p: Schema): string[] {
  const parts: string[] = [];
  if ("default" in p) parts.push(`default = ${JSON.stringify((p as Dict).default)}`);
  if ((p as Dict).deprecated) parts.push("deprecated");
  if (p.format) parts.push(`format: ${p.format}${formatHint(p.format)}`);
  if (p.pattern) parts.push(`pattern: /${p.pattern}/`);
  for (const k of [
    "minLength","maxLength","minimum","maximum","exclusiveMinimum","exclusiveMaximum","minItems","maxItems",
  ] as const) {
    const v = (p as Dict)[k];
    if (v !== undefined) parts.push(`${k.replace("exclusive","exclusive ")} = ${String(v)}`);
  }
  if (p.uniqueItems) parts.push("array items must be unique");
  if (p.additionalProperties === false) parts.push("no additional properties");
  return parts;
}

/** Add a brief hint for common formats. */
function formatHint(fmt?: string): string {
  const map: Dict<string> = {
    email: " (email address)",
    "date-time": " (RFC 3339)",
    uri: " (URI)",
    uuid: " (RFC 4122)",
    hostname: " (hostname)",
    ipv4: " (IPv4)",
    ipv6: " (IPv6)"
  };
  return fmt ? (map[fmt] ?? "") : "";
}

/** Follow internal $ref so referenced shapes are shown inline. */
function resolveRef(schema: Schema, ref?: string): Schema | null {
  if (!ref || !ref.startsWith("#/")) return null;
  const segs = ref.slice(2).split("/");
  let cur: unknown = schema;
  for (const s of segs) {
    if (cur && typeof cur === "object" && s in (cur as Dict)) cur = (cur as Dict)[s];
    else return null;
  }
  return (cur && typeof cur === "object") ? (cur as Schema) : null;
}

/** Merge $ref target with local overrides so the effective shape is documented. */
function maybeDeref(root: Schema, prop: unknown): Schema {
  if (!prop || typeof prop !== "object") return {} as Schema;
  const p = prop as Schema;
  if (!p.$ref) return p;
  const tgt = resolveRef(root, p.$ref);
  if (!tgt) return p;
  const { $ref, ...rest } = p as Dict;
  return { ...(tgt as Dict), ...rest } as Schema;
}

/** Small table helper with stable ordering. */
function table(headers: string[], rows: string[][]): string {
  const head = "|" + headers.join("|") + "|\n";
  const sep  = "|" + headers.map(() => "---").join("|") + "|\n";
  const body = rows.map(r => "|" + r.join("|") + "|").join("\n") + "\n";
  return head + sep + body;
}

/** Render a properties table; return table and field count. */
function renderProps(root: Schema, schema: Schema, required: string[] = []): { md: string; count: number } {
  const props = schema.properties ?? {};
  const headers = ["Field", "Type", "Required", "Description", "Enum / Example", "Notes"];
  const rows: string[][] = [];
  let count = 0;

  Object.keys(props).sort().forEach(k => {
    const p = maybeDeref(root, (props as Dict)[k]);
    const t = typeString(p);
    const req = required.includes(k) ? "✓" : "";
    const desc = escapeMd(p.description ?? "—");
    let ee = "—";
    if (Array.isArray(p.enum) && p.enum.length) {
      ee = p.enum.map(v => "`" + escapeMd(v) + "`").join(", ");
    } else if ("example" in p) {
      ee = "`" + escapeMd(JSON.stringify((p as Dict).example)) + "`";
    } else if (Array.isArray(p.examples) && p.examples.length) {
      ee = "`" + escapeMd(JSON.stringify(p.examples[0])) + "`";
    }
    const note = (constraints(p).map(escapeMd).join("; ")) || "—";
    rows.push(["`" + k + "`", t, req, String(desc), ee, note]);
    count++;
  });

  return { md: table(headers, rows), count };
}

/** Expand object fields and array-of-object fields into their own sections. */
function renderNested(root: Schema, schema: Schema): string {
  const out: string[] = [];
  const props = schema.properties ?? {};
  Object.keys(props).sort().forEach(k => {
    const v = maybeDeref(root, (props as Dict)[k]);
    const isObj = v.type === "object" || "properties" in v || (Array.isArray(v.type) && v.type.includes("object"));
    if (isObj && "properties" in v) {
      const req = Array.isArray(v.required) ? v.required : [];
      const { md } = renderProps(root, v, req);
      out.push(`\n\n### \`${k}\` object\n\n${md}`);
    }
    if (v.type === "array" && v.items && typeof v.items === "object") {
      const it = maybeDeref(root, v.items);
      const itemsIsObj = it.type === "object" || "properties" in it;
      if (itemsIsObj) {
        const reqi = Array.isArray(it.required) ? it.required : [];
        const { md } = renderProps(root, it, reqi);
        out.push(`\n\n### \`${k}[]\` items\n\n${md}`);
      }
    }
  });
  return out.join("");
}

/** Produce a compact example object so readers see the shape quickly. */
function synthExampleFor(p: Schema, depth = 0): unknown {
  if (p.default !== undefined) return p.default;
  if (p.example !== undefined) return p.example;
  if (Array.isArray(p.examples) && p.examples.length) return p.examples[0];

  const t = p.type;
  if (t === "string" || (Array.isArray(t) && t.includes("string"))) {
    switch (p.format) {
      case "email": return "user@example.com";
      case "uuid": return "00000000-0000-0000-0000-000000000000";
      case "date-time": return "2025-01-01T00:00:00Z";
      case "uri": return "https://example.com";
      default: return "string";
    }
  }
  if (t === "integer" || (Array.isArray(t) && t.includes("integer"))) return 1;
  if (t === "number"  || (Array.isArray(t) && t.includes("number")))  return 1.0;
  if (t === "boolean" || (Array.isArray(t) && t.includes("boolean"))) return true;
  if (t === "array"   || (Array.isArray(t) && t.includes("array"))) {
    const it = (p.items ?? {}) as Schema;
    return depth > 1 ? [] : [synthExampleFor(it, depth + 1)];
  }
  if (t === "object"  || (Array.isArray(t) && t.includes("object")) || p.properties) {
    if (depth > 1) return {};
    const obj: Dict = {};
    const props = p.properties ?? {};
    for (const k of Object.keys(props).slice(0, 5)) {
      obj[k] = synthExampleFor(props[k] as Schema, depth + 1);
    }
    return obj;
  }
  return "value";
}

/** A quick example block helps readers copy/paste and adapt. */
function synthQuickExample(schema: Schema): string {
  const obj: Dict = {};
  const props = schema.properties ?? {};
  const keys = Object.keys(props).sort();
  for (const k of keys.slice(0, 12)) {
    const p = maybeDeref(schema, (props as Dict)[k]);
    obj[k] = synthExampleFor(p);
  }
  return JSON.stringify(obj, null, 2);
}

/** Show the shape at a glance: counts, types, formats. */
function validationSummary(schema: Schema): string[] {
  const bullets: string[] = [];
  const props = schema.properties ?? {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  if (required.length) bullets.push(`Required fields: ${required.map(k => "`" + k + "`").join(", ")}`);
  let arrays = 0, objects = 0, strings = 0, numbers = 0, booleans = 0;
  Object.keys(props).forEach(k => {
    const p = maybeDeref(schema, (props as Dict)[k]);
    const t = typeString(p);
    if (t.includes("[]")) arrays++;
    else if (t.includes("object")) objects++;
    else if (t.includes("string")) strings++;
    else if (t.includes("integer") || t.includes("number")) numbers++;
    else if (t.includes("boolean")) booleans++;
    if (p.format) bullets.push(`\`${k}\` expects ${p.format}${formatHint(p.format)}`);
    if (p.pattern) bullets.push(`\`${k}\` must match /${p.pattern}/`);
  });
  bullets.unshift(`Fields: ${Object.keys(props).length}  |  Types: strings ${strings}, numbers ${numbers}, booleans ${booleans}, arrays ${arrays}, objects ${objects}`);
  return bullets;
}

/** One full section per schema. */
function section(name: string, schema: Schema): string {
  const title = name + " schema";
  const desc = schema.description ? String(schema.description) : "";
  const req = Array.isArray(schema.required) ? schema.required : [];
  const { md: tableMd, count } = renderProps(schema, schema, req);
  const nested = renderNested(schema, schema);
  const summary = validationSummary(schema);
  const example = synthQuickExample(schema);

  const parts: string[] = [];
  parts.push(`## ${title}\n`);
  if (desc) parts.push(desc, "");
  parts.push("### Overview");
  parts.push(`- Total fields: **${count}**`);
  if (req.length) parts.push(`- Required: **${req.length}** → ${req.map(k => "`" + k + "`").join(", ")}`);
  parts.push(...summary.map(b => `- ${b}`), "");
  parts.push("### Quick example");
  parts.push("```json", example, "```", "");
  parts.push("### Properties");
  parts.push(tableMd);
  if (nested) parts.push("\n## Nested", nested);
  return parts.join("\n");
}

/** Orchestrate read → render → write with atomic rename to avoid partial files. */
function generate(schemaDir: string, outPath: string, schemaNames: string[]): void {
  const parts: string[] = [
    "# OSS Directory Schema",
    "",
    "> Human-friendly reference generated from local JSON Schemas in this repository. Edit the schemas, then re-generate this page.",
    "",
    "## Table of contents",
    "",
  ];

  const sections: Array<[string, Schema]> = [];
  for (const key of schemaNames) {
    const file = path.join(schemaDir, `${key}.json`);
    const schema = loadJson(file);
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    sections.push([name, schema]);
    parts.push(`- [${name} schema](#${key}-schema)`);
  }
  parts.push("");

  for (const [name, schema] of sections) {
    parts.push(section(name, schema));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp`;
  fs.writeFileSync(tmp, parts.join("\n"), "utf8");
  fs.renameSync(tmp, outPath);
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
}

/** Entry point */
(function main() {
  const argv = process.argv.slice(2);
  const { schemaDir, out, schemas } = parseArgs(argv);
  generate(schemaDir, out, schemas);
})();
