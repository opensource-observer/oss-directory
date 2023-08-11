import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { promises as fs } from 'fs';
import YAML from 'yaml';

const addresses: any = {
  'optimism-goerli': {
    EASContractAddress: '0x1a5650d0ecbca349dd84bafa85790e3e6955eb84',
    schemaUID: '0x739257b1bf8533a29a5c59a6dda5905c50f7c2bf436d709cd9ea7bfabbe5172b'
  },
  'optimism': {
    EASContractAddress: '0x4200000000000000000000000000000000000021',
    schemaUID: '' // TODO: update once the schema has been deployed on OP Mainnet
  }
};

const rpcUrls: Record<string, string> = {
  'optimism-goerli': 'https://goerli.optimism.io',
  'optimism': 'https://mainnet.optimism.io'
};

type AttestInput = {
  privateKey: string;
  network: string;
  repoUrl: string;
  address: string;
  addressType: string;
};

export async function attest(input: AttestInput) {
  const { privateKey, network, repoUrl, address, addressType } = input;

  if (!privateKey) {
    throw new Error('privateKey is required');
  }

  if (!network) {
    throw new Error('network is required');
  }

  const rpcUrl = rpcUrls[network];

  if (!repoUrl) {
    throw new Error('repoUrl is required');
  }

  const githubRepoUrlPattern = /^(https:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\/)?$/;
  if (!githubRepoUrlPattern.test(repoUrl)) {
    throw new Error('repoUrl is not a valid GitHub URL');
  }

  if (!address) {
    throw new Error('address is required');
  }

  const validAddressTypes = ["eoa", "safe", "creator", "factory", "contract"];
  if (!addressType || !validAddressTypes.includes(addressType)) {
    throw new Error(`addressType must be one of ${validAddressTypes.join(", ")}`);
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const EASContractAddress = addresses[network].EASContractAddress;
  if (!EASContractAddress) {
    throw new Error(`EASContractAddress is not available for network "${network}"`);
  }
  const eas = new EAS(EASContractAddress);
  eas.connect(signer);

  const schemaUID = addresses[network].schemaUID;
  if (!schemaUID) {
    throw new Error(`schemaUID is not available for network "${network}"`);
  }

  const schemaEncoder = new SchemaEncoder('string repositoryUrl, address address, bytes32 addressType');
  const encodedData = schemaEncoder.encodeData([
    { name: 'repositoryUrl', value: repoUrl, type: 'string' },
    { name: 'address', value: address, type: 'address' },
    { name: 'addressType', value: addressType, type: 'bytes32' },
  ]);

  const res = await eas.attest({
    schema: schemaUID,
    data: {
      recipient: '0x0000000000000000000000000000000000000000',
      expirationTime: 0,
      revocable: true,
      data: encodedData,
    },
  });

  const hash = res.tx.hash;
  const newAttestationUID = await res.wait();

  return {
    hash,
    uid: newAttestationUID
  };
}

type YAMLData = {
  version: number;
  slug: string;
  name: string;
  github: Array<{ url: string }>;
  optimism: Array<{ address: string, type: string }>;
};

async function getYAMLData(filePath: string): Promise<{ network: string, attestations: AttestInput[] }> {
  const yamlContent = await fs.readFile(filePath, 'utf-8');

  let data: YAMLData;
  try {
    data = YAML.parse(yamlContent) as YAMLData;
  } catch (error) {
    throw new Error("Failed to parse YAML data. Ensure it has the correct structure.");
  }

  const githubRepoUrl = data.github[0].url;  // Assumes the first URL is the monorepo or owner URL

  const attestations = data.optimism.map((item: any) => {
    if (!ethers.utils.isAddress(item.address)) {
      throw new Error(`Invalid Ethereum address: ${item.address}`);
    }
    return {
      repoUrl: githubRepoUrl,
      address: item.address,
      addressType: item.type
    };
  });

  return {
    network: 'optimism',  // Currently hardcoded
    attestations
  };
}

async function main(filePath: string) {
  const inputData = await getYAMLData(filePath);
  for (const attestation of inputData.attestations) {
    const result = await attest({
      ...attestation,
      privateKey: process.env.PRIVATE_KEY,
      network: inputData.network
    });
    console.log('result:', result);
  }
}

if (require.main === module) {
  require('dotenv').config();

  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Please provide a path to the YAML input file.');
    process.exit(1);
  }

  const filePath = args[0];

  (async () => {
    try {
      await fs.stat(filePath);
    } catch (err) {
      console.error('File not found:', filePath);
      process.exit(1);
    }

    await main(filePath);
  })().catch(console.error);
}