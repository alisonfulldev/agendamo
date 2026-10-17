import { describe, expect, it } from "vitest";

import { assignVariant, BUCKETS, EXPERIMENTS, parseBucket } from "./experiments";

describe("experiments", () => {
  const experiment = EXPERIMENTS[0]!;

  it("gives the control to bots and visitors without a bucket", () => {
    expect(assignVariant(experiment, null).id).toBe("a");
  });

  it("is stable for the same bucket and splits buckets evenly", () => {
    expect(assignVariant(experiment, 7)).toEqual(assignVariant(experiment, 7));
    const counts = new Map<string, number>();
    for (let b = 0; b < BUCKETS; b++) {
      const id = assignVariant(experiment, b).id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const values = [...counts.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  it("gives the control when the experiment is off", () => {
    expect(assignVariant({ ...experiment, active: false }, 1).id).toBe("a");
  });

  it("only accepts a valid bucket from the cookie", () => {
    expect(parseBucket("42")).toBe(42);
    for (const bad of [undefined, "", "abc", "-1", "1000", "12345", "4.2"]) {
      expect(parseBucket(bad)).toBeNull();
    }
  });

  it("each experiment has the control first and unique variant ids", () => {
    for (const e of EXPERIMENTS) {
      expect(e.variants[0]!.id).toBe("a");
      expect(new Set(e.variants.map((v) => v.id)).size).toBe(e.variants.length);
    }
  });
});
