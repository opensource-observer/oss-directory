import { z } from "zod"

/**A collection of projects*/
export const CollectionSchema = z.object({ "version": z.number(), "name": z.string(), "display_name": z.string(), "description": z.string().optional(), "projects": z.array(z.string()).min(1), "comments": z.array(z.string()).optional() }).describe("A collection of projects")
export type Collection = z.infer<typeof CollectionSchema>
