import {
  validateProject,
  validateCollection,
  validateUrl,
  validateBlockchainAddress,
  safeCastProject,
  safeCastCollection,
} from "./index.js";

describe("validator", () => {
  describe("validateProject", () => {
    it("should validate a minimal valid project", () => {
      const project = {
        version: 7,
        name: "my-project",
        display_name: "My Project",
      };
      const result = validateProject(project);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should validate a complete project with optional fields", () => {
      const project = {
        version: 7,
        name: "ethereum-project",
        display_name: "Ethereum Project",
        description: "A decentralized protocol",
        websites: [{ url: "https://ethereum.org" }],
        social: {
          twitter: [{ url: "https://twitter.com/ethereum" }],
        },
        github: [{ url: "https://github.com/ethereum/go-ethereum" }],
        blockchain: [
          {
            address: "0x0000000000000000000000000000000000000000",
            networks: ["mainnet"],
            tags: ["contract"],
          },
        ],
      };
      const result = validateProject(project);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should fail validation when required fields are missing", () => {
      const project = {
        version: 7,
        display_name: "Missing Name",
      };
      const result = validateProject(project);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it("should fail validation when version is not a number", () => {
      const project = {
        version: "7" as any,
        name: "bad-version",
        display_name: "Bad Version",
      };
      const result = validateProject(project);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("validateCollection", () => {
    it("should validate a valid collection", () => {
      const collection = {
        version: 7,
        name: "l2-scaling",
        display_name: "Layer 2 Scaling",
        projects: ["arbitrum", "optimism"],
      };
      const result = validateCollection(collection);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should fail validation when projects array is missing", () => {
      const collection = {
        version: 7,
        name: "no-projects",
        display_name: "No Projects",
      };
      const result = validateCollection(collection);
      expect(result.valid).toBe(false);
      expect(result.errors.projects).toBeDefined();
    });
  });

  describe("validateUrl", () => {
    it("should validate a proper URI", () => {
      const validUrl = { url: "https://opensource.observer" };
      const result = validateUrl(validUrl);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should fail validation for an invalid URI", () => {
      const invalidUrl = { url: "not a uri" };
      const result = validateUrl(invalidUrl);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("validateBlockchainAddress", () => {
    it("should validate a correct blockchain address entry", () => {
      const address = {
        address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        networks: ["mainnet"],
        tags: ["contract"],
      };
      const result = validateBlockchainAddress(address);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should fail validation with an invalid network", () => {
      const address = {
        address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        networks: ["unsupported_network"],
        tags: ["contract"],
      };
      const result = validateBlockchainAddress(address);
      expect(result.valid).toBe(false);
    });

    it("should fail validation when tags array is empty", () => {
      const address = {
        address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        networks: ["mainnet"],
        tags: [],
      };
      const result = validateBlockchainAddress(address);
      expect(result.valid).toBe(false);
    });
  });

  describe("safeCastProject", () => {
    it("should return the project when valid", () => {
      const project = {
        version: 7,
        name: "valid-project",
        display_name: "Valid Project",
      };
      const result = safeCastProject(project);
      expect(result).toEqual(project);
    });

    it("should throw an error when project is invalid", () => {
      const origLog = console.log;
      const origWarn = console.warn;
      console.log = () => {};
      console.warn = () => {};

      try {
        const invalidProject = { name: "incomplete" };
        expect(() => safeCastProject(invalidProject)).toThrow(
          "Invalid project.json",
        );
      } finally {
        console.log = origLog;
        console.warn = origWarn;
      }
    });
  });

  describe("safeCastCollection", () => {
    it("should return the collection when valid", () => {
      const collection = {
        version: 7,
        name: "valid-collection",
        display_name: "Valid Collection",
        projects: ["project-a"],
      };
      const result = safeCastCollection(collection);
      expect(result).toEqual(collection);
    });

    it("should throw an error when collection is invalid", () => {
      const origLog = console.log;
      const origWarn = console.warn;
      console.log = () => {};
      console.warn = () => {};

      try {
        const invalidCollection = { version: 7, name: "bad" };
        expect(() => safeCastCollection(invalidCollection)).toThrow(
          "Invalid collection.json",
        );
      } finally {
        console.log = origLog;
        console.warn = origWarn;
      }
    });
  });
});
