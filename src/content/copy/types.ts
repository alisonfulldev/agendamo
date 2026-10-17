/**
 * Shapes of the landing copy (home and niche hubs, docs/design/direction.md). One main pain per
 * page, in the words of who feels it.
 */
export type MockVisual = "bio" | "notification" | "reminder" | "agenda";

export interface PhoneMock {
  business: string;
  services: { name: string; minutes: number }[];
  /** Example professionals; one name = the chat skips the question, like the product. */
  professionals: string[];
  /** First name in the examples (notification, reminder). */
  customer: string;
  /** Instagram-like handle of the bio mock. */
  handle: string;
  slug: string;
  bio: string;
}

export interface LandingCopy {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    /** D1: the free plan's limit, next to the promise. */
    note: string;
    trust: string[];
  };
  /** Home: one door per most common pain, each to its guide. */
  doors?: { title: string; items: { pain: string; answer: string; href: string; label: string }[] };
  /** Niche: scenes of the niche's pains and what changes. */
  pains?: { title: string; items: { scene: string; relief: string }[] };
  story: {
    title: string;
    rows: { kicker: string; title: string; text: string; visual: MockVisual }[];
  };
  compare: {
    title: string;
    before: string;
    after: string;
    rows: { label: string; before: string; after: string }[];
  };
  objections: { title: string; items: { question: string; answer: string; href?: string }[] };
  closing: { title: string; subtitle: string; cta: string };
  mock: PhoneMock;
  /**
   * Health niches (YMYL): a visible notice and the specialist review status. Only scheduling,
   * reminders and service organization; never clinical promises (docs/design/direction.md).
   */
  ymyl?: { notice: string; review: "pendente" | "aprovada" };
}
