import { z } from "zod"

/**A generic named object*/
export const NamedSchema = z.object({ "name": z.string() }).describe("A generic named object")
export type Named = z.infer<typeof NamedSchema>
