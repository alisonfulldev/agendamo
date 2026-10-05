import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import sharp from "sharp";

import { readableOn, themeInk } from "@/brands/theme";
import { brandUrl } from "@/brands/urls";
import { addDaysToDate, todayIn } from "@/lib/availability";
import { loadCatalog } from "@/lib/booking/data";
import { formatDateLong } from "@/lib/booking/details";
import { freeTimesOn } from "@/lib/booking/free-times";
import { getBusinessContext } from "@/lib/business/context";
import { formatBRL } from "@/lib/money";
import { getPlanFeatures } from "@/lib/plans";
import { isCouponActive } from "@/lib/sales/settings";
import { publicUrl } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

export type ArtType =
  "agenda-aberta" | "horarios-hoje" | "horarios-amanha" | "novo-servico" | "oferta";

// Poppins (SIL Open Font License, assets/fonts/OFL.txt): read once, the built-in font has no bold.
const FONT_DIR = join(process.cwd(), "assets/fonts");
const FONTS = Promise.all(
  (
    [
      ["Poppins-Regular.ttf", 400],
      ["Poppins-SemiBold.ttf", 600],
      ["Poppins-ExtraBold.ttf", 800],
    ] as const
  ).map(async ([file, weight]) => ({
    name: "Poppins",
    data: await readFile(join(FONT_DIR, file)),
    weight,
    style: "normal" as const,
  })),
);

const toDataUrl = (jpeg: Buffer) => `data:image/jpeg;base64,${jpeg.toString("base64")}`;

/**
 * The art's photo in the two forms it is drawn: a softly blurred story background (profile photos
 * are small, so a sharp full-screen version would look pixelated) and a sharp square portrait.
 * Photos are stored as WebP, which the image renderer cannot read, so both become JPEG data URLs.
 * Null when the photo cannot be fetched or read.
 */
async function artPhoto(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const source = sharp(Buffer.from(await response.arrayBuffer())).rotate();
    const [background, portrait] = await Promise.all([
      source.clone().resize(540, 960, { fit: "cover" }).blur(18).jpeg({ quality: 80 }).toBuffer(),
      source.clone().resize(600, 600, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer(),
    ]);
    return { background: toDataUrl(background), portrait: toDataUrl(portrait) };
  } catch (error) {
    console.error("art photo failed", error);
    return null;
  }
}

/** 1080×1920 story art in the brand theme with the business identity, QR code and link (Prompt 33). */
export async function GET(request: Request) {
  const context = await getBusinessContext();
  if (!context?.isOwner || !getPlanFeatures(context.business).salesTools)
    return new Response("Not found", { status: 404 });
  const { business, brand } = context;
  const params = new URL(request.url).searchParams;
  const type = (params.get("tipo") ?? "agenda-aberta") as ArtType;
  const supabase = await createClient();

  const page = await supabase
    .from("page_settings")
    .select("avatar_key, primary_color_override")
    .eq("business_id", business.id)
    .maybeSingle();
  const primary = (page.data?.primary_color_override as string | null) ?? brand.theme.primary;
  const onPrimary = readableOn(primary, brand.theme);
  const pageUrl = brandUrl(brand, `/${business.slug}`);
  const qr = await QRCode.toDataURL(pageUrl, { width: 360, margin: 1 });
  // The profile photo, else the first photo of the gallery.
  let photoUrl = publicUrl(page.data?.avatar_key as string | null);
  if (!photoUrl) {
    const { data: first } = await supabase
      .from("page_photos")
      .select("object_key")
      .eq("business_id", business.id)
      .eq("hidden", false)
      .order("position")
      .limit(1)
      .maybeSingle();
    photoUrl = publicUrl(first?.object_key as string | null);
  }
  const photo = await artPhoto(photoUrl);
  const ink = themeInk(brand.theme);
  const fg = photo ? ink.light : onPrimary;
  const shortUrl = pageUrl.replace(/^https?:\/\//, "").split("?")[0];
  let dayLabel = "";

  let title = "Agenda aberta!";
  let subtitle = "Escolha seu horário pelo link";
  let highlight: string[] = [];

  if (type === "horarios-hoje" || type === "horarios-amanha") {
    const catalog = await loadCatalog(business.id);
    const today = todayIn(business.timezone, new Date());
    const date = type === "horarios-hoje" ? today : addDaysToDate(today, 1);
    const times = catalog ? await freeTimesOn(catalog, date) : [];
    title = type === "horarios-hoje" ? "Horários livres hoje" : "Horários livres amanhã";
    dayLabel = formatDateLong(`${date}T15:00:00Z`, "UTC");
    subtitle = times.length
      ? "Corre que é por ordem de chegada"
      : "Consulte os próximos dias pelo link";
    highlight = times.slice(0, 9);
  } else if (type === "novo-servico") {
    const { data: service } = await supabase
      .from("services")
      .select("name, price_cents")
      .eq("id", params.get("servico") ?? "")
      .eq("business_id", business.id)
      .maybeSingle();
    title = "Novidade!";
    subtitle = service
      ? `${service.name as string} · ${formatBRL(service.price_cents as number)}`
      : "Novo serviço na agenda";
  } else if (type === "oferta") {
    const { data: coupon } = await supabase
      .from("business_coupons")
      .select("*")
      .eq("code", (params.get("cupom") ?? "").toUpperCase())
      .eq("business_id", business.id)
      .maybeSingle();
    const active =
      coupon &&
      isCouponActive(
        coupon as { valid_until: string | null; max_uses: number | null; uses: number },
      );
    title = "Oferta relâmpago";
    subtitle = active
      ? `${coupon.discount_type === "percent" ? `${coupon.discount_value}% OFF` : `${formatBRL(coupon.discount_value as number)} OFF`} com o cupom ${coupon.code}`
      : "Consulte as condições pelo link";
  }

  const W = 1080;
  const H = 1920;
  const layer = { position: "absolute", top: 0, left: 0, width: W, height: H } as const;
  // Smaller portrait when many times need the room.
  const portraitSize = highlight.length > 4 ? 360 : 480;

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        display: "flex",
        background: primary,
        color: fg,
        fontFamily: "Poppins",
      }}
    >
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img */}
          <img
            src={photo.background}
            width={W}
            height={H}
            style={{ ...layer, objectFit: "cover" }}
            alt=""
          />
          <div style={{ ...layer, background: ink.dark, opacity: 0.3 }} />
          <div
            style={{
              ...layer,
              top: H - 1350,
              height: 1350,
              backgroundImage: `linear-gradient(180deg, transparent, ${ink.dark})`,
              opacity: 0.95,
            }}
          />
          <div
            style={{
              ...layer,
              height: 420,
              backgroundImage: `linear-gradient(0deg, transparent, ${ink.dark})`,
              opacity: 0.6,
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              top: -260,
              left: W - 500,
              width: 760,
              height: 760,
              borderRadius: 380,
              background: onPrimary,
              opacity: 0.08,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 760,
              left: -320,
              width: 640,
              height: 640,
              borderRadius: 320,
              background: onPrimary,
              opacity: 0.06,
            }}
          />
        </>
      )}

      <div
        style={{
          ...layer,
          display: "flex",
          flexDirection: "column",
          padding: "96px 80px 80px",
        }}
      >
        {/* Identity */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.1 }}>{business.name}</div>
          <div style={{ fontSize: 30, fontWeight: 600, opacity: 0.85 }}>Agendamento online</div>
        </div>

        {photo ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 56 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img */}
            <img
              src={photo.portrait}
              width={portraitSize}
              height={portraitSize}
              style={{
                borderRadius: portraitSize / 2,
                border: `10px solid ${ink.light}`,
                objectFit: "cover",
              }}
              alt=""
            />
          </div>
        ) : null}

        {/* Message */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 24 }}>
          {dayLabel ? (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: 4,
                textTransform: "uppercase",
                opacity: 0.9,
              }}
            >
              {dayLabel}
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 1 }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 44, opacity: 0.92 }}>{subtitle}</div>
          {highlight.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 16 }}>
              {highlight.map((time) => (
                <div
                  key={time}
                  style={{
                    display: "flex",
                    fontSize: 60,
                    fontWeight: 800,
                    padding: "14px 36px",
                    borderRadius: 28,
                    background: photo ? ink.light : onPrimary,
                    color: photo ? ink.dark : primary,
                  }}
                >
                  {time}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Call to action */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            marginTop: 64,
            padding: 32,
            borderRadius: 44,
            background: brand.theme.surface,
            color: brand.theme.text,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img */}
          <img src={qr} width={230} height={230} style={{ borderRadius: 20 }} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ fontSize: 50, fontWeight: 800, color: primary }}>Agende pelo link</div>
            <div style={{ fontSize: 32, fontWeight: 600 }}>{shortUrl}</div>
            <div style={{ fontSize: 28, color: brand.theme.muted }}>
              ou aponte a câmera para o QR code
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      width: W,
      height: H,
      fonts: await FONTS,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
