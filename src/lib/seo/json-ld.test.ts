import { describe, expect, it } from "vitest";

import { jsonLdHtml } from "./json-ld";

describe("jsonLdHtml", () => {
  it("never lets text close the script tag", () => {
    const html = jsonLdHtml({ description: "</script><script>alert(1)</script>" });
    expect(html).not.toContain("<");
    expect(JSON.parse(html)).toEqual({ description: "</script><script>alert(1)</script>" });
  });
});
