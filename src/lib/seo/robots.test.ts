import { describe, expect, it } from "vitest";

import { AI_CRAWLERS, DISALLOWED_PATHS, EXPLICIT_CRAWLERS, robotsTxt } from "./robots";

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
    for (const { agent } of AI_CRAWLERS) {
      if (!EXPLICIT_CRAWLERS.includes(agent)) expect(txt).not.toContain(`User-agent: ${agent}`);
    }
    expect(txt.trimEnd().endsWith(`Sitemap: ${sitemapUrl}`)).toBe(true);
  });

  it("gives OpenAI's crawlers their own group with the same rules as *", () => {
    const groups = robotsTxt({ production: true, sitemapUrl }).split("\n\n");
    const openai = groups.find((g) => g.includes("User-agent: OAI-SearchBot"))!;
    const lines = openai.split("\n");
    for (const agent of EXPLICIT_CRAWLERS) expect(lines).toContain(`User-agent: ${agent}`);
    for (const path of DISALLOWED_PATHS) expect(lines).toContain(`Disallow: ${path}`);
    expect(lines).toContain("Allow: /");
  });

  it("adds a full block for each blocked crawler", () => {
    const txt = robotsTxt({ production: true, sitemapUrl, blocked: ["GPTBot"] });
    expect(txt).toContain("User-agent: GPTBot\nDisallow: /\n");
  });
});
