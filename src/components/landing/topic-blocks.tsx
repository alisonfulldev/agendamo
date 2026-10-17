import { NoShowCalculator } from "@/components/tools/no-show-calculator";
import {
  HOME_LANDING,
  NICHE_LANDINGS,
  type MockVisual,
  type PhoneMock,
} from "@/content/copy/landing";

import { MockVisualFor } from "./mocks";

/** Product mock that shows the change a guide talks about (by topic or intent slug). */
const VISUAL_BY_TOPIC: Record<string, MockVisual> = {
  "reduzir-faltas": "reminder",
  "lembrete-automatico": "reminder",
  "agendar-pelo-whatsapp": "notification",
  "pelo-whatsapp": "notification",
  "agendar-pelo-instagram": "bio",
  "link-na-bio": "bio",
  multiagenda: "agenda",
};

/** The niche's example business (or the home's), for the mocks of its guides. */
export function mockFor(brandKey?: string): PhoneMock {
  return (brandKey && NICHE_LANDINGS[brandKey]?.mock) || HOME_LANDING.mock;
}

/** Mock of the guide's topic, centered, or nothing when the topic has none. */
export function TopicVisual({ topic, brandKey }: { topic: string; brandKey?: string }) {
  const visual = VISUAL_BY_TOPIC[topic];
  if (!visual) return null;
  return (
    <div className="lp-warm mt-8 flex justify-center rounded-[2rem] px-4 py-10">
      <MockVisualFor visual={visual} mock={mockFor(brandKey)} />
    </div>
  );
}

/** The no-show calculator inside the guides about no-shows. */
export function NoShowBlock() {
  return (
    <section aria-labelledby="calculadora" className="mt-14">
      <h2 id="calculadora" className="lp-display font-heading text-2xl font-semibold sm:text-3xl">
        Quanto as faltas custam para você?
      </h2>
      <p className="mt-2 text-muted-foreground">
        Uma estimativa com os seus números. Nada é enviado ou salvo.
      </p>
      <NoShowCalculator />
    </section>
  );
}
