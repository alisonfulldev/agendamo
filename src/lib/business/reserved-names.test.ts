import { describe, expect, it } from "vitest";

import { isReservedBusinessName } from "./reserved-names";

describe("isReservedBusinessName", () => {
  it.each([
    "MeetChat",
    "meet chat oficial",
    "Suporte Meet-Chat",
    "MEET.CHAT",
    "Meetchát",
    "m33tch4t",
  ])("blocks %s", (name) => expect(isReservedBusinessName(name)).toBe(true));

  it.each(["Studio Lumi", "Meet Beauty", "Chat da Ana", "Barbearia do Zé"])("allows %s", (name) =>
    expect(isReservedBusinessName(name)).toBe(false),
  );
});
