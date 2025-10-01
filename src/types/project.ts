import { z } from "zod"

/**A project is a collection of artifacts*/
export const ProjectSchema = z.object({ "version": z.number(), "name": z.string(), "display_name": z.string(), "description": z.string().optional(), "websites": z.array(z.any()).optional(), "social": z.any().optional(), "github": z.array(z.any()).optional(), "npm": z.array(z.any()).optional(), "crates": z.array(z.any()).optional(), "pypi": z.array(z.any()).optional(), "go": z.array(z.any()).optional(), "open_collective": z.array(z.any()).optional(), "blockchain": z.array(z.any()).optional(), "defillama": z.array(z.any()).optional(), "comments": z.array(z.string()).optional() }).describe("A project is a collection of artifacts")
export type Project = z.infer<typeof ProjectSchema>
