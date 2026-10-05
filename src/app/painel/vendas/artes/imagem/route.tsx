import { ImageResponse } from "next/og";
import QRCode from "qrcode";

import { readableOn } from "@/brands/theme";
import { brandUrl } from "@/brands/urls";
import { addDaysToDate, todayIn } from "@/lib/availability";
import { loadCatalog } from "@/lib/booking/data";
import { freeTimesOn } from "@/lib/booking/free-times";
import { getBusinessContext } from "@/lib/business/context";
import { formatBRL } from "@/lib/money";
import { getPlanFeatures } from "@/lib/plans";
import { isCouponActive } from "@/lib/sales/settings";
import { publicUrl } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

export type ArtType =
  "agenda-aberta" | "horarios-hoje" | "horarios-amanha" | "novo-servico" | "oferta";

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
  const avatar = publicUrl(page.data?.avatar_key as string | null);

  let title = "Agenda aberta!";
  let subtitle = "Escolha seu horário pelo link";
  let highlight: string[] = [];

  if (type === "horarios-hoje" || type === "horarios-amanha") {
    const catalog = await loadCatalog(business.id);
    const today = todayIn(business.timezone, new Date());
    const date = type === "horarios-hoje" ? today : addDaysToDate(today, 1);
    const times = catalog ? await freeTimesOn(catalog, date) : [];
    title = type === "horarios-hoje" ? "Horários livres hoje" : "Horários livres amanhã";
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

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "120px 80px",
        background: primary,
        color: onPrimary,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img
          <img
            src={avatar}
            width={220}
            height={220}
            style={{ borderRadius: 110, border: `8px solid ${onPrimary}` }}
            alt=""
          />
        ) : null}
        <div style={{ fontSize: 56, fontWeight: 700 }}>{business.name}</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 48 }}>{subtitle}</div>
        {highlight.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 20,
              maxWidth: 900,
            }}
          >
            {highlight.map((time) => (
              <div
                key={time}
                style={{
                  display: "flex",
                  fontSize: 54,
                  fontWeight: 700,
                  padding: "16px 32px",
                  borderRadius: 24,
                  background: brand.theme.background,
                  color: brand.theme.text,
                }}
              >
                {time}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img */}
        <img src={qr} width={300} height={300} style={{ borderRadius: 24 }} alt="" />
        <div style={{ fontSize: 40, fontWeight: 600 }}>
          {pageUrl.replace(/^https?:\/\//, "").split("?")[0]}
        </div>
      </div>
    </div>,
    { width: 1080, height: 1920, headers: { "Cache-Control": "private, no-store" } },
  );
}
