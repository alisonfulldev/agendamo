import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { convertToWebp, ConvertError } = await import("./convert");
const { MAX_UPLOAD_BYTES } = await import("./presets");

const image = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 80, b: 120 } },
  });

describe("convertToWebp (server fallback)", () => {
  it("makes the square profile photo from a huge JPEG (108 MP)", async () => {
    const input = await image(12000, 9000).jpeg().toBuffer();
    const out = await convertToWebp(input, "avatar");
    expect([out.width, out.height]).toEqual([400, 400]);
    expect(out.bytes.length).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
    expect((await sharp(out.bytes).metadata()).format).toBe("webp");
  });

  it("fits a phone screenshot (PNG) as a cover without enlarging", async () => {
    const input = await image(1080, 2340).png().toBuffer();
    const out = await convertToWebp(input, "cover");
    expect(out.height).toBe(1200);
    expect(out.width).toBe(Math.round((1080 * 1200) / 2340));
  });

  it("follows the EXIF orientation", async () => {
    // 600x300 stored, orientation 6 (rotate 90°): shown as 300x600.
    const input = await image(600, 300).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const out = await convertToWebp(input, "photo");
    expect([out.width, out.height]).toEqual([300, 600]);
  });

  it("refuses something that is not an image", async () => {
    await expect(convertToWebp(new TextEncoder().encode("%PDF-1.4"), "avatar")).rejects.toBeInstanceOf(
      ConvertError,
    );
  });
});
