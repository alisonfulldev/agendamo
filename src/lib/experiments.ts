/**
 * Headline and CTA experiments of the marketing pages (docs/design/experiments.md). Each
 * visitor gets a stable bucket (cookie set by the proxy, no personal data); search engine bots
 * never get one, so they always see the control and the indexable content never flips.
 * Variants only override visible copy (title, CTA); metadata, schema and URLs never change.
 */
export const EXPERIMENT_COOKIE = "mc_ab";
/** Internal request header with the bucket drawn on the first visit (set by the proxy only). */
export const BUCKET_HEADER = "x-ab-bucket";
/** Buckets 0–999: enough to split traffic evenly between 2 or 3 variants. */
export const BUCKETS = 1000;

export interface Variant {
  /** "a" is always the control (the copy in the content files). */
  id: string;
  title?: string;
  cta?: string;
}

export interface Experiment {
  id: string;
  /** Page template where it runs (site_events.template). */
  template: string;
  /** Path where it runs. */
  path: string;
  active: boolean;
  variants: Variant[];
}

export const EXPERIMENTS: readonly Experiment[] = [
  {
    id: "home-hero",
    template: "home",
    path: "/",
    active: true,
    variants: [
      { id: "a" },
      {
        id: "b",
        title: "Chega de responder “tem horário?” o dia todo.",
        cta: "Criar meu link grátis agora",
      },
    ],
  },
  {
    id: "barbearia-hero",
    template: "nicho",
    path: "/barbearia",
    active: true,
    variants: [
      { id: "a" },
      { id: "b", title: "O cliente marca o corte. Você continua na máquina." },
    ],
  },
];

/** The visitor's bucket from the cookie value, or null (bots, no cookie yet, garbage). */
export function parseBucket(value: string | undefined | null): number | null {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const bucket = Number(value);
  return bucket < BUCKETS ? bucket : null;
}

/** Variant of an experiment for a bucket; the control without a bucket or when inactive. */
export function assignVariant(experiment: Experiment, bucket: number | null): Variant {
  if (!experiment.active || bucket === null) return experiment.variants[0]!;
  return experiment.variants[bucket % experiment.variants.length]!;
}

export function experimentForPath(path: string): Experiment | null {
  return EXPERIMENTS.find((e) => e.path === path) ?? null;
}
