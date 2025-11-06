import { z } from "zod"

/**A generic URL*/
export const UrlSchema = z.object({ "url": z.string().url() }).describe("A generic URL")
export type URL = z.infer<typeof UrlSchema>
