import { describe, expect, it } from "vitest";

import {
  getAvailableDays,
  getAvailableSlots,
  getAvailableSlotsAnyProfessional,
  pickProfessional,
  type AvailabilityInput,
  type ProfessionalAvailability,
} from "@/lib/availability";

// 2030-01-08 is a Tuesday. America/Sao_Paulo is UTC-3 (no DST).
const DATE = "2030-01-08";
const utc = (iso: string) => new Date(iso);
const local = (time: string, date = DATE) => new Date(`${date}T${time}:00-03:00`);

function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    date: DATE,
    timezone: "America/Sao_Paulo",
    workingHours: [
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "13:00", endTime: "18:00" },
    ],
    timeOff: [],
    appointments: [],
    externalBusy: [],
    services: [{ durationMinutes: 60, bufferMinutes: 0, resourceIds: [] }],
    resourceBusy: {},
    slotIntervalMinutes: 30,
    minNoticeMinutes: 0,
    maxDaysAhead: 60,
    now: utc("2030-01-01T12:00:00Z"),
    ...overrides,
  };
}

const times = (i: AvailabilityInput) => getAvailableSlots(i).map((slot) => slot.time);

describe("getAvailableSlots", () => {
  it("offers every grid start that fits the working hours, skipping lunch", () => {
    expect(times(input())).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
    ]);
  });

  it("returns UTC instants and local times", () => {
    const [first] = getAvailableSlots(input());
    expect(first).toEqual({
      startsAt: "2030-01-08T12:00:00.000Z",
      endsAt: "2030-01-08T13:00:00.000Z",
      time: "09:00",
    });
  });

  it("does not offer a block that crosses lunch or the end of the day", () => {
    const slots = times(
      input({ services: [{ durationMinutes: 90, bufferMinutes: 0, resourceIds: [] }] }),
    );
    expect(slots).not.toContain("11:00"); // 11:00–12:30 crosses lunch
    expect(slots).toContain("10:30"); // 10:30–12:00 fits exactly
    expect(slots).not.toContain("17:00"); // would end at 18:30
    expect(slots.at(-1)).toBe("16:30");
  });

  it("skips existing appointments (conflict)", () => {
    const slots = times(input({ appointments: [{ start: local("10:00"), end: local("11:00") }] }));
    expect(slots).not.toContain("09:30"); // 09:30–10:30 overlaps
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("09:00"); // ends exactly at 10:00
    expect(slots).toContain("11:00"); // starts exactly at 11:00
  });

  it("counts the buffer as busy time that must fit", () => {
    const slots = times(
      input({ services: [{ durationMinutes: 45, bufferMinutes: 15, resourceIds: [] }] }),
    );
    expect(slots).toContain("11:00"); // 11:00–11:45 + 15 buffer = 12:00
    expect(slots).toContain("17:00");

    const withAppointment = times(
      input({
        services: [{ durationMinutes: 45, bufferMinutes: 15, resourceIds: [] }],
        appointments: [{ start: local("10:00"), end: local("11:00") }],
      }),
    );
    expect(withAppointment).toContain("09:00"); // 09:00–10:00 with buffer, touches but does not overlap
    expect(withAppointment).not.toContain("09:30");
  });

  it("books a two-service combo as one continuous block", () => {
    const combo = input({
      services: [
        { durationMinutes: 30, bufferMinutes: 0, resourceIds: [] },
        { durationMinutes: 60, bufferMinutes: 0, resourceIds: [] },
      ],
    });
    const [first] = getAvailableSlots(combo);
    expect(first!.endsAt).toBe("2030-01-08T13:30:00.000Z"); // 09:00 + 90 min
    expect(times(combo)).toContain("10:30");
    expect(times(combo)).not.toContain("11:00");
  });

  it("respects the minimum notice", () => {
    const slots = times(input({ now: local("08:00"), minNoticeMinutes: 120 }));
    expect(slots[0]).toBe("10:00");
  });

  it("handles 'now' in the middle of the day", () => {
    const slots = times(input({ now: local("14:10") }));
    expect(slots[0]).toBe("14:30");
    expect(slots).not.toContain("09:00");
  });

  it("returns nothing for past days", () => {
    expect(times(input({ now: utc("2030-01-09T12:00:00Z") }))).toEqual([]);
  });

  it("respects the booking horizon (max days ahead)", () => {
    expect(times(input({ now: utc("2030-01-01T12:00:00Z"), maxDaysAhead: 7 }))).not.toEqual([]);
    expect(times(input({ now: utc("2030-01-01T12:00:00Z"), maxDaysAhead: 6 }))).toEqual([]);
  });

  it("returns nothing on a day without working hours", () => {
    expect(times(input({ workingHours: [] }))).toEqual([]);
  });

  it("blocks a whole-day time off", () => {
    expect(times(input({ timeOff: [{ start: local("00:00"), end: local("23:59") }] }))).toEqual([]);
  });

  it("blocks a partial time off", () => {
    const slots = times(input({ timeOff: [{ start: local("13:00"), end: local("15:00") }] }));
    expect(slots).toContain("11:00");
    expect(slots).not.toContain("13:00");
    expect(slots).not.toContain("14:30");
    expect(slots).toContain("15:00");
  });

  it("blocks external (Google Calendar) busy times", () => {
    const slots = times(input({ externalBusy: [{ start: local("16:00"), end: local("16:30") }] }));
    expect(slots).not.toContain("15:30");
    expect(slots).not.toContain("16:00");
    expect(slots).toContain("16:30");
  });

  it.each([
    [15, ["09:00", "09:15", "09:30"]],
    [30, ["09:00", "09:30", "10:00"]],
    [60, ["09:00", "10:00", "11:00"]],
  ] as const)("uses a %i-minute grid", (interval, expected) => {
    expect(times(input({ slotIntervalMinutes: interval })).slice(0, 3)).toEqual(expected);
  });

  it("works in the America/Sao_Paulo timezone", () => {
    const [first] = getAvailableSlots(input());
    expect(first!.startsAt).toBe(local("09:00").toISOString());
    expect(first!.startsAt.slice(11, 16)).toBe("12:00"); // 09:00 local = 12:00 UTC
  });

  it("blocks a slot when a required resource is busy, even with the professional free", () => {
    const slots = times(
      input({
        services: [{ durationMinutes: 60, bufferMinutes: 0, resourceIds: ["room"] }],
        resourceBusy: { room: [{ start: local("14:00"), end: local("15:00") }] },
      }),
    );
    expect(slots).not.toContain("13:30");
    expect(slots).not.toContain("14:00");
    expect(slots).not.toContain("14:30");
    expect(slots).toContain("13:00");
    expect(slots).toContain("15:00");
  });

  it("checks resources only during the step that needs them", () => {
    // Step 1 (30 min) uses no resource; step 2 (30 min) needs the room.
    const slots = times(
      input({
        services: [
          { durationMinutes: 30, bufferMinutes: 0, resourceIds: [] },
          { durationMinutes: 30, bufferMinutes: 0, resourceIds: ["room"] },
        ],
        resourceBusy: { room: [{ start: local("09:30"), end: local("10:00") }] },
      }),
    );
    expect(slots).not.toContain("09:00"); // step 2 would use the room 09:30–10:00
    expect(slots).toContain("09:30"); // step 1 (no room) covers 09:30–10:00, room needed 10:00–10:30
  });
});

describe("getAvailableSlotsAnyProfessional", () => {
  const base = input();
  const professionals: ProfessionalAvailability[] = [
    {
      professionalId: "ana",
      workingHours: base.workingHours,
      timeOff: [],
      appointments: [{ start: local("09:00"), end: local("12:00") }],
      externalBusy: [],
      services: base.services,
    },
    {
      professionalId: "bia",
      workingHours: [{ startTime: "09:00", endTime: "10:00" }],
      timeOff: [],
      appointments: [],
      externalBusy: [],
      services: base.services,
    },
  ];

  it("returns the union of slots with who is free at each one", () => {
    const slots = getAvailableSlotsAnyProfessional({ ...base, professionals });
    expect(slots[0]).toMatchObject({ time: "09:00", professionalIds: ["bia"] });
    expect(slots.find((s) => s.time === "13:00")!.professionalIds).toEqual(["ana"]);
    expect(slots.map((s) => s.time)).not.toContain("10:00");
  });
});

describe("pickProfessional", () => {
  it("picks whoever has fewer appointments that day", () => {
    expect(pickProfessional(["ana", "bia"], { ana: 3, bia: 1 })).toBe("bia");
  });

  it("breaks ties by the given order", () => {
    expect(pickProfessional(["ana", "bia"], { ana: 2, bia: 2 })).toBe("ana");
    expect(pickProfessional(["ana", "bia"], {})).toBe("ana");
  });

  it("returns null without candidates", () => {
    expect(pickProfessional([], {})).toBeNull();
  });
});

describe("getAvailableDays", () => {
  it("lists the next days that have at least one free slot", () => {
    const days = getAvailableDays({
      fromDate: "2030-01-06", // Sunday
      days: 7,
      buildInput: (date) => {
        const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
        return input({
          date,
          workingHours: weekday >= 2 && weekday <= 6 ? input().workingHours : [],
        });
      },
    });
    expect(days.map((d) => d.date)).toEqual([
      "2030-01-08",
      "2030-01-09",
      "2030-01-10",
      "2030-01-11",
      "2030-01-12",
    ]);
    expect(days[0]!.slotCount).toBe(14);
  });
});
