import { afterEach, describe, expect, it, vi } from "vitest";

import { indexNowKey, indexNowPayloads, submitIndexNow } from "./indexnow";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("indexNowKey", () => {
  it("accepts only the protocol's format", () => {
    vi.stubEnv("INDEXNOW_KEY", "abc");
    expect(indexNowKey()).toBeNull();
    vi.stubEnv("INDEXNOW_KEY", "0f3a9c2e-7b1d-4e5f");
    expect(indexNowKey()).toBe("0f3a9c2e-7b1d-4e5f");
  });
});

describe("indexNowPayloads", () => {
  it("groups by host, dedupes, skips non-https and points to the key file", () => {
    const payloads = indexNowPayloads(
      [
        "https://meetchat.com.br/ana/perfil",
        "https://meetchat.com.br/ana/perfil",
        "https://agendapsi.com.br/bia/perfil",
        "http://localhost:3000/x",
        "not a url",
      ],
      "key12345",
    );
    expect(payloads).toEqual([
      {
        host: "meetchat.com.br",
        key: "key12345",
        keyLocation: "https://meetchat.com.br/indexnow-key.txt",
        urlList: ["https://meetchat.com.br/ana/perfil"],
      },
      {
        host: "agendapsi.com.br",
        key: "key12345",
        keyLocation: "https://agendapsi.com.br/indexnow-key.txt",
        urlList: ["https://agendapsi.com.br/bia/perfil"],
      },
    ]);
  });
});

describe("submitIndexNow", () => {
  it("does nothing outside production", async () => {
    vi.stubEnv("INDEXNOW_KEY", "key12345");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await submitIndexNow(["https://meetchat.com.br/"])).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts once per host in production and never throws", async () => {
    vi.stubEnv("INDEXNOW_KEY", "key12345");
    vi.stubEnv("VERCEL_ENV", "production");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockRejectedValueOnce(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const accepted = await submitIndexNow([
      "https://meetchat.com.br/a",
      "https://agendapsi.com.br/b",
    ]);
    expect(accepted).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.indexnow.org/indexnow");
  });
});
