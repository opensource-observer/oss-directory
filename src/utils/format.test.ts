import {
  getCollectionPath,
  getProjectPath,
  orderProjectFields,
  mergeProjects,
} from "./format.js";

describe("format utils", () => {
  describe("getCollectionPath", () => {
    it("should return the default relative path for a collection slug", () => {
      const slug = "optimism";
      const result = getCollectionPath(slug);
      expect(result).toBe("data/collections/optimism.yaml");
    });

    it("should respect custom options for baseDir, collectionDir, and extension", () => {
      const slug = "defi";
      const opts = {
        baseDir: "./custom/",
        collectionDir: "./groups/",
        extension: ".json",
      };
      const result = getCollectionPath(slug, opts);
      expect(result).toBe("custom/groups/defi.json");
    });
  });

  describe("getProjectPath", () => {
    it("should return the default relative path with first character folder", () => {
      const slug = "uniswap";
      const result = getProjectPath(slug);
      expect(result).toBe("data/projects/u/uniswap.yaml");
    });

    it("should handle project slugs starting with a number", () => {
      const slug = "1inch";
      const result = getProjectPath(slug);
      expect(result).toBe("data/projects/1/1inch.yaml");
    });

    it("should respect custom options for baseDir, projectDir, and extension", () => {
      const slug = "arbitrum";
      const opts = {
        baseDir: "./custom/",
        projectDir: "./my-projects/",
        extension: ".json",
      };
      const result = getProjectPath(slug, opts);
      expect(result).toBe("custom/my-projects/a/arbitrum.json");
    });
  });

  describe("orderProjectFields", () => {
    it("should order project fields with standard keys first and preserve extra fields", () => {
      const input = {
        display_name: "Test Project",
        description: "A test project",
        name: "test-project",
        version: 7,
        extra_field: "preserved",
      } as any;

      const result = orderProjectFields(input);
      const keys = Object.keys(result);

      expect(keys.slice(0, 4)).toEqual([
        "version",
        "name",
        "display_name",
        "description",
      ]);
      expect(result.version).toBe(7);
      expect(result.name).toBe("test-project");
      expect(result.display_name).toBe("Test Project");
      expect((result as any).extra_field).toBe("preserved");
      expect(keys[keys.length - 1]).toBe("extra_field");
    });
  });

  describe("mergeProjects", () => {
    it("should overwrite scalar fields in dst with values from src", () => {
      const dst = {
        version: 7,
        name: "test-project",
        display_name: "Original Name",
        description: "Original Description",
      };
      const src = {
        display_name: "Updated Name",
      };

      const result = mergeProjects(dst, src);
      expect(result.display_name).toBe("Updated Name");
      expect(result.description).toBe("Original Description");
      expect(result.name).toBe("test-project");
      expect(result.version).toBe(7);
    });

    it("should concatenate arrays and deduplicate identical elements", () => {
      const dst = {
        version: 7,
        name: "test-project",
        display_name: "Test Project",
        github: [{ url: "https://github.com/my-org/repo1" }],
        websites: [{ url: "https://site1.com" }],
      };
      const src = {
        github: [
          { url: "https://github.com/my-org/repo1" },
          { url: "https://github.com/my-org/repo2" },
        ],
        websites: [{ url: "https://site2.com" }],
      };

      const result = mergeProjects(dst, src);
      expect(result.github).toEqual([
        { url: "https://github.com/my-org/repo1" },
        { url: "https://github.com/my-org/repo2" },
      ]);
      expect(result.websites).toEqual([
        { url: "https://site1.com" },
        { url: "https://site2.com" },
      ]);
    });

    it("should throw an error if the merged result is an invalid project", () => {
      const origLog = console.log;
      const origWarn = console.warn;
      console.log = () => {};
      console.warn = () => {};

      try {
        const dst = { description: "Invalid without required fields" };
        const src = { extra: "data" };

        expect(() => mergeProjects(dst, src)).toThrow("Invalid project.json");
      } finally {
        console.log = origLog;
        console.warn = origWarn;
      }
    });
  });
});
