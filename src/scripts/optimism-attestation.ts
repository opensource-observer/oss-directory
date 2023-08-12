import * as dotenv from "dotenv";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { ensure } from "../utils/common.js";
import { readProjectFile } from "../validator/index.js";
import { BlockchainAddress } from "../types/blockchain-address.js";
dotenv.config();

const addresses: any = {
  "optimism-goerli": {
    EASContractAddress: "0x4200000000000000000000000000000000000021",
    schemaUID:
      "0x739257b1bf8533a29a5c59a6dda5905c50f7c2bf436d709cd9ea7bfabbe5172b",
  },
  optimism: {
    EASContractAddress: "0x4200000000000000000000000000000000000020",
    schemaUID:
      "0x739257b1bf8533a29a5c59a6dda5905c50f7c2bf436d709cd9ea7bfabbe5172b",
  },
};

const rpcUrls: Record<string, string> = {
  "optimism-goerli": "https://goerli.optimism.io",
  optimism: "https://mainnet.optimism.io",
};

type AttestInput = {
  privateKey?: string;
  network?: string;
  repoUrl: string;
  address: string;
  addressType: string;
};

export async function attest(input: AttestInput) {
  const { privateKey, network, repoUrl, address, addressType } = input;

  if (!privateKey) {
    throw new Error("privateKey is required");
  }

  if (!network) {
    throw new Error("network is required");
  }

  const rpcUrl = rpcUrls[network];

  if (!repoUrl) {
    throw new Error("repoUrl is required");
  }

  /*
  const githubRepoUrlPattern =
    /^(https:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\/)?$/;
  if (!githubRepoUrlPattern.test(repoUrl)) {
    throw new Error("repoUrl is not a valid GitHub URL");
  }
  */

  if (!address) {
    throw new Error("address is required");
  }

  const validAddressTypes = ["eoa", "safe", "creator", "factory", "contract"];
  if (!addressType || !validAddressTypes.includes(addressType)) {
    throw new Error(
      `addressType must be one of ${validAddressTypes.join(", ")}`,
    );
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const EASContractAddress = addresses[network].EASContractAddress;
  if (!EASContractAddress) {
    throw new Error(
      `EASContractAddress is not available for network "${network}"`,
    );
  }
  const eas = new EAS(EASContractAddress);
  eas.connect(signer);

  const schemaUID = addresses[network].schemaUID;
  if (!schemaUID) {
    throw new Error(`schemaUID is not available for network "${network}"`);
  }

  const schemaEncoder = new SchemaEncoder(
    "string repositoryUrl, address address, bytes32 addressType",
  );
  const encodedData = schemaEncoder.encodeData([
    { name: "repositoryUrl", value: repoUrl, type: "string" },
    { name: "address", value: address, type: "address" },
    { name: "addressType", value: addressType, type: "bytes32" },
  ]);

  const res = await eas.attest(
    {
      schema: schemaUID,
      data: {
        recipient: "0x0000000000000000000000000000000000000000",
        expirationTime: 0,
        revocable: true,
        data: encodedData,
      },
    },
    {
      gasLimit: 500000,
    },
  );

  const hash = res.tx.hash;
  const newAttestationUID = await res.wait();

  return {
    hash,
    uid: newAttestationUID,
  };
}

async function getData(
  filePath: string,
  network: string,
): Promise<{ network: string; attestations: AttestInput[] }> {
  const project = await readProjectFile(filePath);

  const githubList = ensure(
    project.github,
    "No GitHub URLs found in the project file",
  );
  const githubRepoUrl = githubList[0].url; // Assumes the first URL is the monorepo or owner URL

  const optimismList = ensure(
    project.optimism,
    "No Optimism addresses found in the project file",
  );
  const attestations = optimismList.map((item: BlockchainAddress) => {
    if (!ethers.utils.isAddress(item.address)) {
      throw new Error(`Invalid Ethereum address: ${item.address}`);
    }
    return {
      repoUrl: githubRepoUrl,
      address: item.address,
      addressType: item.type,
    };
  });

  return {
    network,
    attestations,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error(
      "Please provide a path to the YAML input file and the network ('optimism' or 'optimism-goerli').",
    );
    process.exit(1);
  }
  const filePath = args[0];
  const network = args[1];

  if (network !== "optimism" && network !== "optimism-goerli") {
    console.error(
      "Invalid network. Please use 'optimism' or 'optimism-goerli'.",
    );
    process.exit(1);
  }

  const inputData = await getData(filePath, network);
  for (const attestation of inputData.attestations) {
    console.log(
      `Creating attestation for repo ${attestation.repoUrl} and address ${attestation.address} of type ${attestation.addressType}`,
    );
    const result = await attest({
      ...attestation,
      privateKey: process.env.PRIVATE_KEY,
      network: network,
    });
    console.log("result:", result);
  }
}

main().catch((error) => {
  console.error("Error occurred:", error);
  process.exit(1);
});
