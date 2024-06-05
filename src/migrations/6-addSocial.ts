import { Migration } from "../types.js";

/**
 * Move `twitter` to `social` and set the name of `social` to the project name.
 * @param existing
 * @returns
 */
async function updateProjects(existing: any): Promise<any> {
  existing.social = {};

  if (existing.twitter) {
    existing.social.twitter = [
      { url: `https://twitter.com/${existing.twitter}` },
    ];
    delete existing.twitter;
  }
  if (existing.telegram) {
    existing.telegram = [{ url: existing.twitter }, ...existing.telegram];
    delete existing.twitter;
  }

  // Check for Telegram and Discord URLs in websites and move them to social
  if (existing.websites && Array.isArray(existing.websites)) {
    const remainingWebsites = [];
    for (const website of existing.websites) {
      const url = website.url;
      if (url && url.startsWith("https://t.me/")) {
        existing.social.telegram = existing.social.telegram || [];
        existing.social.telegram.push({ url: url });
      } else if (url && url.startsWith("https://discord.com/")) {
        existing.social.discord = existing.social.discord || [];
        existing.social.discord.push({ url: url });
      } else if (url && url.startsWith("https://medium.com/")) {
        existing.social.medium = existing.social.medium || [];
        existing.social.medium.push({ url: url });
      } else {
        remainingWebsites.push(url);
      }
    }
    // Update websites with the remaining URLs or delete if empty
    if (remainingWebsites.length > 0) {
      existing.websites = remainingWebsites.map((url: string) => ({
        url: url,
      }));
    } else {
      delete existing.websites;
    }
  }

  // delete social if empty
  if (
    Object.keys(existing.social).every(
      (key) =>
        Array.isArray(existing.social[key]) &&
        existing.social[key].length === 0,
    )
  ) {
    delete existing.social;
  }
  return existing;
}

const migration: Migration = {
  version: 6,
  project: {
    up: updateProjects,
  },
  collection: {
    up: async (existing: any) => existing, // No change for collections
  },
};

export default migration;
