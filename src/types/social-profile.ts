import { z } from "zod"

/**All social profile*/
export const SocialProfileSchema = z.object({ "farcaster": z.array(z.any()).optional(), "medium": z.array(z.any()).optional(), "mirror": z.array(z.any()).optional(), "telegram": z.array(z.any()).optional(), "twitter": z.array(z.any()).optional() }).describe("All social profile")
export type SocialProfile = z.infer<typeof SocialProfileSchema>
