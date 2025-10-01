import { z } from "zod"

/**An address on a blockchain*/
export const BlockchainAddressSchema = z.object({ "address": z.string(), "tags": z.array(z.enum(["bridge","contract","creator","deployer","eoa","factory","proxy","safe","wallet"])).min(1), "networks": z.array(z.enum(["any_evm","arbitrum_one","automata","base","bob","cyber","frax","ham","ink","kroma","linea","lisk","lyra","mainnet","mantle","matic","metal","mint","mode","optimism","orderly","pgn","polynomial","polygon_zkevm","race","redstone","scroll","shape","soneium","swan","swell","unichain","worldchain","xterio","zksync_era","zora"])).min(1), "name": z.string().optional() }).describe("An address on a blockchain")
export type BlockchainAddress = z.infer<typeof BlockchainAddressSchema>
