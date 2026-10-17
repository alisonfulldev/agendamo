import { describe, expect, it } from "vitest";

import { NICHES } from "@/brands";

import {
  directoryUrls,
  fileLastmod,
  nicheHubUrls,
  nicheTopicUrls,
  paginate,
  sitemapIndexXml,
  sitePageUrls,
  urlsetXml,
} from "./sitemaps";

const url = (path: string) => `https://meetchat.com.br${path}`;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("sitemap sections", () => {
  it("lists every niche page once, with a recorded (not build-time) date", () => {
    const urls = nicheHubUrls(url);
    expect(urls).toHaveLength(NICHES.length);
    expect(new Set(urls.map((u) => u.loc)).size).toBe(urls.length);
    for (const u of urls) expect(u.lastmod).toMatch(DATE);
  });

  it("lists the institutional pages with their recorded dates and clean URLs", () => {
    const urls = sitePageUrls(url);
    expect(urls.map((u) => u.loc)).toContain("https://meetchat.com.br/precos");
    for (const u of urls) {
      expect(u.lastmod).toMatch(DATE);
      expect(u.loc).not.toContain("?");
    }
  });
});

describe("paginate", () => {
  it("keeps a plain name when one file is enough and drops empty groups", () => {
    const files = paginate([
      { name: "site", urls: [{ loc: url("/") }] },
      { name: "diretorio", urls: [] },
    ]);
    expect(files.map((f) => f.name)).toEqual(["site"]);
  });

  it("splits big groups at the limit", () => {
    const urls = Array.from({ length: 5 }, (_, i) => ({ loc: url(`/p${i}`) }));
    const files = paginate([{ name: "perfis", urls }], 2);
    expect(files.map((f) => [f.name, f.urls.length])).toEqual([
      ["perfis-1", 2],
      ["perfis-2", 2],
      ["perfis-3", 1],
    ]);
  });
});

describe("xml", () => {
  it("escapes URLs and writes dates as YYYY-MM-DD", () => {
    const xml = urlsetXml([{ loc: url("/a?b=1&c=2"), lastmod: "2026-10-12T10:00:00Z" }]);
    expect(xml).toContain("<loc>https://meetchat.com.br/a?b=1&amp;c=2</loc>");
    expect(xml).toContain("<lastmod>2026-10-12</lastmod>");
  });

  it("index uses the newest date of each file", () => {
    const file = {
      name: "perfis",
      urls: [
        { loc: url("/a"), lastmod: "2026-10-01" },
        { loc: url("/b"), lastmod: "2026-10-09T08:00:00Z" },
        { loc: url("/c") },
      ],
    };
    expect(fileLastmod(file)).toBe("2026-10-09T08:00:00Z");
    expect(
      sitemapIndexXml([{ loc: url("/sitemap/perfis.xml"), lastmod: fileLastmod(file) }]),
    ).toContain(
      "<sitemap><loc>https://meetchat.com.br/sitemap/perfis.xml</loc><lastmod>2026-10-09</lastmod></sitemap>",
    );
  });
});

describe("niche subpages", () => {
  it("lists every published subpage once, clean and dated", () => {
    const urls = nicheTopicUrls(url);
    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls.map((u) => u.loc)).size).toBe(urls.length);
    for (const u of urls) {
      expect(u.loc).toMatch(/^https:\/\/meetchat\.com\.br\/[a-z-]+\/[a-z-]+$/);
      expect(u.lastmod).toMatch(DATE);
    }
  });
});

describe("directory", () => {
  it("lists only indexable cities, dated by the newest profile", () => {
    const urls = directoryUrls(url, [
      {
        route: "barbearia",
        cities: [
          { citySlug: "campinas", indexable: true, updatedAt: "2026-10-12T10:00:00Z" },
          { citySlug: "recife", indexable: false, updatedAt: "2026-10-12T10:00:00Z" },
        ],
      },
    ]);
    expect(urls).toEqual([
      { loc: "https://meetchat.com.br/barbearia/campinas", lastmod: "2026-10-12T10:00:00Z" },
    ]);
  });
});
