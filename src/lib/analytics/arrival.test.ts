import { describe, expect, it } from "vitest";

import { ARRIVAL_TTL_MS, arrivalFrom, campaignQuery, keepArrival, parseArrival } from "./arrival";

const base = { referrer: "", host: "meetchat.com.br", path: "/", now: 1000 };

describe("arrivalFrom", () => {
  it("keeps the UTM tags, the referring domain and the ad click id", () => {
    expect(
      arrivalFrom({
        ...base,
        search: "?utm_source=chatgpt.com&utm_medium=referral&gclid=abc&nome=Ana",
        referrer: "https://chatgpt.com/c/123",
        path: "/precos",
      }),
    ).toEqual({
      at: 1000,
      landing: "/precos",
      utm_source: "chatgpt.com",
      utm_medium: "referral",
      referrer: "chatgpt.com",
      click: "google",
    });
  });

  it("ignores the site's own pages as referrer", () => {
    const arrival = arrivalFrom({ ...base, search: "", referrer: "https://meetchat.com.br/x" });
    expect(arrival.referrer).toBeUndefined();
  });
});

describe("keepArrival", () => {
  const direct = { at: 0, landing: "/" };
  const chatgpt = { at: 10, landing: "/", utm_source: "chatgpt.com" };
  const google = { at: 20, landing: "/", referrer: "www.google.com" };

  it("keeps the first touch while it is fresh", () => {
    expect(keepArrival(chatgpt, google)).toBe(chatgpt);
  });

  it("replaces a direct visit by one with an origin, and an expired one by anything", () => {
    expect(keepArrival(direct, chatgpt)).toBe(chatgpt);
    expect(keepArrival(chatgpt, { ...direct, at: 11 + ARRIVAL_TTL_MS })).toEqual({
      ...direct,
      at: 11 + ARRIVAL_TTL_MS,
    });
    expect(keepArrival(null, direct)).toBe(direct);
  });
});

describe("parseArrival", () => {
  it("drops broken or old values", () => {
    expect(parseArrival("{", 0)).toBeNull();
    expect(parseArrival(JSON.stringify({ at: 0 }), ARRIVAL_TTL_MS + 1)).toBeNull();
    expect(parseArrival(JSON.stringify({ at: 5, utm_source: "x" }), 10)).toEqual({
      at: 5,
      utm_source: "x",
    });
  });
});

describe("campaignQuery", () => {
  it("passes only campaign tags and click ids to Analytics", () => {
    expect(campaignQuery("?criar=1&nome=Ana&utm_source=chatgpt.com&gclid=1")).toBe(
      "?utm_source=chatgpt.com&gclid=1",
    );
    expect(campaignQuery("?criar=1&ramo=barber")).toBe("");
  });
});
