/**
 * Most types in this directory are automatically generated
 * from a JSON schema.
 * These types are not
 */
import { BlockchainAddress } from "./blockchain-address.js";

/**
 * blockchain-address.ts
 */

// This is only used to get the type of `networks`
const EXAMPLE_ADDRESS: BlockchainAddress = {
  address: "0x123",
  networks: ["mainnet"],
  tags: ["eoa"],
};
type NetworkTuple = typeof EXAMPLE_ADDRESS.networks;
type TagTuple = typeof EXAMPLE_ADDRESS.tags;
// All valid types for the blockchain `networks` field
type BlockchainNetwork = NetworkTuple[number];
// All valid types for the blockchain `tags` field
type BlockchainTag = TagTuple[number];

export { BlockchainNetwork, BlockchainTag };
