import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { missingImages, photoReminderCopy } = await import("./photo-reminder");

describe("photo reminder", () => {
  it("knows what is missing", () => {
    expect(missingImages(null)).toEqual({ avatar: true, cover: true });
    expect(missingImages({ avatar_key: "a", cover_key: null })).toEqual({
      avatar: false,
      cover: true,
    });
  });

  it("names exactly what is missing", () => {
    expect(photoReminderCopy({ avatar: true, cover: true }).paragraphs[1]).toContain(
      "a foto de perfil e a capa",
    );
    expect(photoReminderCopy({ avatar: true, cover: false }).subject).toBe(
      "Coloque a foto do seu perfil",
    );
    expect(photoReminderCopy({ avatar: false, cover: true }).paragraphs[1]).toContain(
      "Falta a capa",
    );
  });
});
