import { describe, expect, it } from "vitest";

import { freeSlotsMessage, joinTimes } from "@/lib/sales/free-slots";

describe("free slots message", () => {
  it("joins times the Brazilian way", () => {
    expect(joinTimes([])).toBe("");
    expect(joinTimes(["14:00"])).toBe("14:00");
    expect(joinTimes(["14:00", "15:30", "17:00"])).toBe("14:00, 15:30 e 17:00");
  });

  it("announces the day's free times with the link", () => {
    expect(
      freeSlotsMessage({
        businessName: "Studio Bela",
        day: "hoje",
        times: ["14:00", "16:30"],
        url: "https://x.com/studio-bela",
      }),
    ).toBe(
      "Horários livres hoje em Studio Bela: 14:00 e 16:30. Agende pelo link: https://x.com/studio-bela",
    );
  });

  it("limits the list and is empty when nothing is free", () => {
    const times = ["09:00", "10:00", "11:00", "12:00"];
    expect(freeSlotsMessage({ businessName: "B", day: "amanhã", times, url: "u", max: 2 })).toBe(
      "Horários livres amanhã em B: 09:00, 10:00 e outros. Agende pelo link: u",
    );
    expect(freeSlotsMessage({ businessName: "B", day: "hoje", times: [], url: "u" })).toBe("");
  });
});
