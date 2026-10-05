import {
  Activity,
  Apple,
  ArrowRight,
  AudioLines,
  Bone,
  BookOpen,
  Brain,
  Briefcase,
  Camera,
  Car,
  Dumbbell,
  Eye,
  Flower2,
  Footprints,
  GraduationCap,
  Hand,
  HandHeart,
  Leaf,
  type LucideIcon,
  Paintbrush,
  PawPrint,
  PenTool,
  PersonStanding,
  Puzzle,
  Scissors,
  Smile,
  Sofa,
  Sparkles,
  Stethoscope,
  Sun,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import { NICHES, type BrandConfig } from "@/brands";
import type { NicheGroup } from "@/brands/schema";
import { brandThemeStyle } from "@/brands/theme";

export const NICHE_ICONS: Record<NonNullable<BrandConfig["niche"]>["icon"], LucideIcon> = {
  sparkles: Sparkles,
  scissors: Scissors,
  flower: Flower2,
  brush: Paintbrush,
  eye: Eye,
  pen: PenTool,
  brain: Brain,
  sofa: Sofa,
  activity: Activity,
  apple: Apple,
  audio: AudioLines,
  puzzle: Puzzle,
  book: BookOpen,
  smile: Smile,
  stethoscope: Stethoscope,
  footprints: Footprints,
  bone: Bone,
  "hand-heart": HandHeart,
  target: Target,
  hand: Hand,
  leaf: Leaf,
  person: PersonStanding,
  sun: Sun,
  dumbbell: Dumbbell,
  paw: PawPrint,
  cap: GraduationCap,
  camera: Camera,
  briefcase: Briefcase,
  car: Car,
  trophy: Trophy,
};

export const NICHE_GROUP_LABELS: Record<NicheGroup, string> = {
  beauty: "Beleza e estética",
  health: "Saúde",
  wellness: "Bem-estar e movimento",
  pets: "Pets",
  services: "Aulas e serviços",
};

/** Niches in the order of their groups, for lists on the site. */
export function nichesByGroup() {
  return (Object.keys(NICHE_GROUP_LABELS) as NicheGroup[])
    .map((group) => ({
      group,
      label: NICHE_GROUP_LABELS[group],
      niches: NICHES.filter((brand) => brand.niche!.group === group),
    }))
    .filter((section) => section.niches.length > 0);
}

/** Niche list grouped by area: each card opens the niche page (/beleza…) and its sign-up. */
export function NicheCards({ heading = "Feito para o seu tipo de negócio" }: { heading?: string }) {
  return (
    <section
      id="nichos"
      aria-labelledby="nichos-titulo"
      className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24"
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">Nichos</p>
        <h2
          id="nichos-titulo"
          className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          Serviços, textos e exemplos prontos para cada área. Escolha a sua.
        </p>
      </div>
      <div className="flex flex-col gap-12">
        {nichesByGroup().map((section) => (
          <div key={section.group}>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {section.label}
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.niches.map((brand) => {
                const niche = brand.niche!;
                const Icon = NICHE_ICONS[niche.icon];
                return (
                  <li key={brand.key}>
                    <Link
                      href={`/${niche.route}`}
                      data-theme-scope=""
                      style={brandThemeStyle(brand)}
                      className="group flex h-full items-start gap-4 rounded-2xl border bg-card p-4 text-card-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-balance">{niche.label}</h4>
                        <p className="mt-1 text-sm text-pretty text-muted-foreground">
                          {niche.pitch}
                        </p>
                      </div>
                      <ArrowRight
                        className="mt-1 size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
