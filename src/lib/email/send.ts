import "server-only";

import { Resend } from "resend";

import type { BrandConfig } from "@/brands";
import { saveDemoEmail } from "@/lib/demo/mailbox";
import { isDemoMode } from "@/lib/demo/mode";
import { getServerEnv } from "@/lib/env";

import { renderEmail, type EmailContent } from "./layout";

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailInput {
  brand: BrandConfig;
  to: string | string[];
  subject: string;
  content: EmailContent;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  id?: string;
  /** True when Resend is not configured (development): the e-mail was only logged. */
  skipped?: boolean;
}

let client: Resend | undefined;

/**
 * Sender of a brand. RESEND_FROM overrides it while the brand domain is not verified: a full
 * "Name <address>" replaces everything; a bare address keeps the brand's name.
 */
export function senderFor(brand: Pick<BrandConfig, "emailFrom">, override?: string): string {
  if (override?.includes("<")) return override;
  return `${brand.emailFrom.name} <${override || brand.emailFrom.address}>`;
}

/** Sends a branded e-mail. Sender is the brand's emailFrom (RESEND_FROM overrides in development). */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getServerEnv();
  const { html, text } = renderEmail(input.brand, input.content);

  if (isDemoMode()) {
    const saved = saveDemoEmail({
      brandKey: input.brand.key,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html,
      text,
      attachments: (input.attachments ?? []).map((a) => a.filename),
    });
    return { id: saved.id };
  }

  if (!env.RESEND_API_KEY) {
    console.info(
      `[email skipped: RESEND_API_KEY not set] to=${String(input.to)} subject="${input.subject}"\n${text}`,
    );
    return { skipped: true };
  }

  client ??= new Resend(env.RESEND_API_KEY);
  const from = senderFor(input.brand, env.RESEND_FROM);
  const headers: Record<string, string> = {};
  if (input.content.unsubscribeUrl) {
    // One-click endpoint (RFC 8058); the visible link opens the confirmation page.
    headers["List-Unsubscribe"] =
      `<${input.content.unsubscribeUrl.replace("/descadastrar?", "/api/unsubscribe?")}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const { data, error } = await client.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html,
    text,
    replyTo: input.replyTo,
    headers,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return { id: data?.id };
}
