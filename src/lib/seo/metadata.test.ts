import { afterEach, describe, expect, it, vi } from "vitest";

import { psychology } from "@/brands/psychology";

import { pageMetadata } from "./metadata";

afterEach(() => vi.unstubAllEnvs());

describe("pageMetadata", () => {
  it("builds a clean canonical, social cards and no robots for indexable pages", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://meetchat.com.br");
    const meta = pageMetadata({
      title: "Agenda para psicólogos | MeetChat",
      description: "Descrição.",
      path: "/psicologia?criar=1&ramo=psicologia#topo",
    });
    expect(meta.title).toEqual({ absolute: "Agenda para psicólogos | MeetChat" });
    expect(meta.alternates?.canonical).toBe("https://meetchat.com.br/psicologia");
    expect(meta.openGraph?.url).toBe("https://meetchat.com.br/psicologia");
    expect(meta.openGraph?.siteName).toBe("MeetChat");
    expect(meta.robots).toBeUndefined();
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("noindex keeps links followed", () => {
    expect(pageMetadata({ title: "t", description: "d", path: "/", index: false }).robots).toEqual({
      index: false,
      follow: true,
    });
  });

  it("uses the brand's own domain for its pages in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const brand = { ...psychology, domains: ["agendapsi.com.br"] };
    const meta = pageMetadata({ title: "t", description: "d", path: "/ana/perfil", brand });
    expect(meta.alternates?.canonical).toBe("https://agendapsi.com.br/ana/perfil");
  });
});
