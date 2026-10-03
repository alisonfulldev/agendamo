import { z } from "zod";

/** Brand niche. Services like nails, lashes and brows live inside "beauty". */
export const SEGMENTS = [
  "beauty",
  "barber",
  "aesthetics",
  "psychology",
  "physio",
  "personal_trainer",
  "tattoo",
] as const;

/** Fonts available to brands. Each one must also be loaded in src/brands/fonts.ts. */
export const FONT_CSS_VARIABLES = {
  poppins: "--font-poppins",
  oswald: "--font-oswald",
  inter: "--font-inter",
  lora: "--font-lora",
  nunito: "--font-nunito",
} as const;

export const FONT_KEYS = Object.keys(FONT_CSS_VARIABLES) as [
  keyof typeof FONT_CSS_VARIABLES,
  ...(keyof typeof FONT_CSS_VARIABLES)[],
];

/**
 * Variables allowed inside chatMessages, e.g. "Você está na agenda de {business}." The business
 * name may be a person's name: avoid "da/do {business}".
 */
export const CHAT_VARIABLES = [
  "business",
  "service",
  "professional",
  "date",
  "time",
  "price",
  "customerName",
  "depositAmount",
  "deadline",
] as const;

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color (# + 6 hex digits)");
const text = z.string().trim().min(1);
const publicAsset = z.string().regex(/^\/brands\/[a-z0-9-]+\/[\w.-]+$/, "Use /brands/<key>/<file>");
const domain = z
  .string()
  .regex(/^(?!www\.)[a-z0-9-]+(\.[a-z0-9-]+)+$/, "Lowercase domain without protocol, port or www");

const chatMessage = text.refine(
  (message) =>
    [...message.matchAll(/\{(\w+)\}/g)].every(([, name]) =>
      (CHAT_VARIABLES as readonly string[]).includes(name!),
    ),
  {
    message: `Only these variables are allowed: ${CHAT_VARIABLES.map((v) => `{${v}}`).join(", ")}`,
  },
);

const term = z.object({ singular: text, plural: text });
const titledItem = z.object({ title: text, description: text });

export const brandConfigSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: text,
  domains: z.array(domain).min(1),
  logo: publicAsset,
  favicon: publicAsset,
  defaultSegment: z.enum(SEGMENTS),
  theme: z.object({
    primary: hexColor,
    background: hexColor,
    surface: hexColor,
    text: hexColor,
    muted: hexColor,
    button: hexColor,
    accent: hexColor,
    /** Errors and destructive actions. */
    danger: hexColor,
    headingFont: z.enum(FONT_KEYS),
    bodyFont: z.enum(FONT_KEYS),
    radius: z.string().regex(/^\d+(\.\d+)?rem$/, "Use rem, e.g. 0.75rem"),
  }),
  sales: z.object({
    title: text,
    subtitle: text,
    /** Example conversation animated on the sales page (prices follow suggestedServices order). */
    demo: z.object({
      businessName: text,
      bio: text,
      prices: z.array(z.number().int().nonnegative()).max(10),
      customerName: text,
      /** e.g. "Sábado, 14 de março". */
      dayLabel: text,
      /** e.g. "14:00". */
      time: z.string().regex(/^\d{2}:\d{2}$/),
    }),
    /** Three short pains the product removes ("Responde 'tem horário?' o dia todo"). */
    pains: z.array(text).length(3),
    /** What comes with the plan (cards on the sales page). */
    benefits: z.array(titledItem).min(1),
    howItWorks: z.array(titledItem).min(1),
    faq: z.array(z.object({ question: text, answer: text })).min(1),
    testimonials: z.array(
      z.object({
        name: text,
        role: text,
        quote: text,
        /** Sample testimonials are shown with an "Exemplo" label. */
        isExample: z.boolean(),
      }),
    ),
  }),
  suggestedServices: z
    .array(
      z.object({
        name: text,
        durationMinutes: z.number().int().positive().multipleOf(5),
      }),
    )
    .min(1),
  terms: z.object({
    customer: term,
    service: term,
    appointment: term,
  }),
  chatMessages: z.object({
    greeting: chatMessage,
    askProfessional: chatMessage,
    askDate: chatMessage,
    askTime: chatMessage,
    noSlots: chatMessage,
    askName: chatMessage,
    askPhone: chatMessage,
    askEmail: chatMessage,
    optInLabel: chatMessage,
    askCoupon: chatMessage,
    summary: chatMessage,
    successConfirmed: chatMessage,
    /** Appended to the final message only when the customer left an e-mail. */
    emailNote: chatMessage,
    successPending: chatMessage,
    successDeposit: chatMessage,
    conflict: chatMessage,
    blocked: chatMessage,
    error: chatMessage,
  }),
  /** Suggested WhatsApp messages the owner can edit. Variables: {customerName}, {business}, {service}. */
  messageTemplates: z.object({
    reactivation: text,
    return: text,
    birthday: text,
    abandoned: text,
  }),
  emailFrom: z.object({
    name: text,
    address: z.email(),
  }),
  socialLinks: z.object({
    instagram: z.url().optional(),
    tiktok: z.url().optional(),
    facebook: z.url().optional(),
    youtube: z.url().optional(),
  }),
});

export type BrandConfig = z.infer<typeof brandConfigSchema>;
export type BrandConfigInput = z.input<typeof brandConfigSchema>;
export type Segment = (typeof SEGMENTS)[number];
export type FontKey = keyof typeof FONT_CSS_VARIABLES;
export type ChatVariable = (typeof CHAT_VARIABLES)[number];
