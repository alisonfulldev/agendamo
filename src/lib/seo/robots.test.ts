import { describe, expect, it } from "vitest";

import { AI_CRAWLERS, robotsTxt } from "./robots";

const sitemapUrl = "https://meetchat.com.br/sitemap.xml";

describe("robotsTxt", () => {
  it("blocks everything outside production", () => {
    expect(robotsTxt({ production: false, sitemapUrl })).toBe("User-agent: *\nDisallow: /\n");
  });

  it("closes private areas, keeps assets and AI crawlers open and points to the sitemap index", () => {
    const txt = robotsTxt({ production: true, sitemapUrl });
    expect(txt).toContain("Disallow: /painel\n");
    expect(txt).toContain("Disallow: /*?criar=\n");
    expect(txt).not.toMatch(/Disallow: \/_next/);
    for (const { agent } of AI_CRAWLERS) expect(txt).not.toContain(`User-agent: ${agent}`);
    expect(txt.trimEnd().endsWith(`Sitemap: ${sitemapUrl}`)).toBe(true);
  });

  it("adds a full block for each blocked crawler", () => {
    const txt = robotsTxt({ production: true, sitemapUrl, blocked: ["GPTBot"] });
    expect(txt).toContain("User-agent: GPTBot\nDisallow: /\n");
  });
});
