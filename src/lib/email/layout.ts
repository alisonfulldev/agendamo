import type { BrandConfig } from "@/brands";
import { readableOn } from "@/brands/theme";

export interface EmailContent {
  /** Hidden preview text shown by mail clients. */
  preheader?: string;
  heading: string;
  /** One-time code shown large right under the heading (sign-in by code). */
  code?: string;
  /** Plain-text paragraphs (escaped). */
  paragraphs: string[];
  /** Label/value lines, e.g. appointment details. */
  details?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  secondaryLinks?: { label: string; url: string }[];
  /** Small text under the content. */
  footnote?: string;
  /** Marketing e-mails must include it (rule 10). */
  unsubscribeUrl?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Single e-mail layout for every message. Colors come from the brand file (e-mail clients do not
 * support CSS variables). The header is the brand name as text because many clients block SVG.
 */
export function renderEmail(
  brand: BrandConfig,
  content: EmailContent,
): { html: string; text: string } {
  const { theme } = brand;
  const buttonText = readableOn(theme.button, theme);
  const font =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const code = content.code
    ? `<p style="margin:0 0 20px;font-size:34px;line-height:44px;font-weight:700;letter-spacing:8px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;color:${theme.primary};">${escapeHtml(content.code)}</p>`
    : "";

  const paragraphs = content.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:24px;">${escapeHtml(p)}</p>`)
    .join("");

  const details = content.details?.length
    ? `<table role="presentation" width="100%" style="margin:0 0 20px;border-collapse:collapse;">${content.details
        .map(
          (d) =>
            `<tr><td style="padding:6px 0;color:${theme.muted};font-size:14px;width:40%;">${escapeHtml(d.label)}</td>` +
            `<td style="padding:6px 0;font-size:15px;font-weight:600;">${escapeHtml(d.value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";

  const cta = content.cta
    ? `<p style="margin:8px 0 24px;"><a href="${escapeHtml(content.cta.url)}" style="display:inline-block;background:${theme.button};color:${buttonText};text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${escapeHtml(content.cta.label)}</a></p>`
    : "";

  const secondary = content.secondaryLinks?.length
    ? `<p style="margin:0 0 16px;font-size:14px;">${content.secondaryLinks
        .map(
          (l) =>
            `<a href="${escapeHtml(l.url)}" style="color:${theme.primary};">${escapeHtml(l.label)}</a>`,
        )
        .join(" &nbsp;·&nbsp; ")}</p>`
    : "";

  const footnote = content.footnote
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:20px;color:${theme.muted};">${escapeHtml(content.footnote)}</p>`
    : "";

  const unsubscribe = content.unsubscribeUrl
    ? `<p style="margin:8px 0 0;"><a href="${escapeHtml(content.unsubscribeUrl)}" style="color:${theme.muted};">Não quero mais receber estes e-mails</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${theme.background};color:${theme.text};font-family:${font};">
${content.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(content.preheader)}</div>` : ""}
<table role="presentation" width="100%" style="background:${theme.background};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;">
<tr><td style="padding:0 8px 16px;font-size:20px;font-weight:700;color:${theme.primary};">${escapeHtml(brand.name)}</td></tr>
<tr><td style="background:${theme.surface};border-radius:12px;padding:28px 24px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:30px;">${escapeHtml(content.heading)}</h1>
${code}${paragraphs}${details}${cta}${secondary}${footnote}
</td></tr>
<tr><td style="padding:16px 8px;font-size:12px;line-height:18px;color:${theme.muted};">
Enviado por ${escapeHtml(brand.name)}.${unsubscribe}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.heading,
    "",
    ...(content.code ? [content.code, ""] : []),
    ...content.paragraphs,
    ...(content.details?.map((d) => `${d.label}: ${d.value}`) ?? []),
    content.cta ? `\n${content.cta.label}: ${content.cta.url}` : "",
    ...(content.secondaryLinks?.map((l) => `${l.label}: ${l.url}`) ?? []),
    content.footnote ?? "",
    content.unsubscribeUrl ? `\nDescadastrar: ${content.unsubscribeUrl}` : "",
    `\n— ${brand.name}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { html, text };
}
