import { ChevronDown } from "lucide-react";
import type React from "react";
import Link from "next/link";

import { OpenCreationLink } from "@/components/creation/open-creation";
import type { FaqItem, GuideSection } from "@/content/niche-guides/types";
import { NOTE } from "@/content/copy/shared";
import { formatPageDate } from "@/content/site-pages";
import { createEntityLinker, type EntityLinker } from "@/lib/seo/entity-links";
import { slugify } from "@/lib/slug";

/**
 * Guide body: H1, update date, direct answer, sections and an optional notice. Mentions of other
 * topics in the paragraphs become contextual links (src/lib/seo/entity-links.ts).
 */
export function GuideArticle({
  h1,
  updatedAt,
  answer,
  sections,
  notice,
  path,
  afterAnswer,
}: {
  h1: string;
  updatedAt: string;
  answer: string;
  sections: readonly GuideSection[];
  notice?: string;
  /** Clean path of the page (never linked to itself). */
  path: string;
  /** Extra block between the answer and the sections (author, table of contents). */
  afterAnswer?: React.ReactNode;
}) {
  const linker = createEntityLinker({ currentPath: path });
  return (
    <article>
      <h1 className="lp-display mt-6 font-heading text-[2.25rem] leading-[1.08] font-semibold text-balance sm:text-5xl">
        {h1}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Atualizado em {formatPageDate(updatedAt)}
      </p>
      <div className="mt-6 rounded-3xl border bg-brand-50 p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          Resposta rápida
        </p>
        <p className="mt-2 text-lg leading-relaxed text-pretty">{answer}</p>
      </div>
      {afterAnswer}
      <GuideSections sections={sections} linker={linker} />
      {notice ? (
        <p
          role="note"
          className="mt-10 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
        >
          {notice}
        </p>
      ) : null}
    </article>
  );
}

/** Anchor of a section title (table of contents). */
export const sectionId = (title: string) => slugify(title);

/** The guide's sections (h2 with an anchor + paragraphs and lists). */
export function GuideSections({
  sections,
  linker,
}: {
  sections: readonly GuideSection[];
  linker?: EntityLinker;
}) {
  return sections.map((section) => (
    <section key={section.title} className="mt-10">
      <h2
        id={sectionId(section.title)}
        className="scroll-mt-4 text-2xl font-bold tracking-tight text-balance"
      >
        {section.title}
      </h2>
      {section.paragraphs?.map((paragraph) => (
        <p
          key={paragraph}
          className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground"
        >
          {linker ? <LinkedText linker={linker} text={paragraph} /> : paragraph}
        </p>
      ))}
      {section.list ? <GuideList ordered={section.ordered} items={section.list} /> : null}
    </section>
  ));
}

function LinkedText({ linker, text }: { linker: EntityLinker; text: string }) {
  return linker.link(text).map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <Link
        key={index}
        href={part.href}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {part.text}
      </Link>
    ),
  );
}

function GuideList({ ordered, items }: { ordered?: boolean; items: readonly string[] }) {
  const className =
    "mt-4 flex flex-col gap-2.5 pl-6 text-lg leading-relaxed text-muted-foreground marker:text-primary";
  const children = items.map((item) => <li key={item}>{item}</li>);
  return ordered ? (
    <ol className={`${className} list-decimal`}>{children}</ol>
  ) : (
    <ul className={`${className} list-disc`}>{children}</ul>
  );
}

/** Visible FAQ (always open: the answers are part of the page). */
export function GuideFaq({ items }: { items: readonly FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq" className="mt-14">
      <h2 id="faq" className="text-2xl font-bold tracking-tight">
        Perguntas frequentes
      </h2>
      <div className="mt-5 flex flex-col divide-y rounded-2xl border bg-card px-5">
        {items.map((item) => (
          <details key={item.question} className="group py-4" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                className="site-chevron size-5 shrink-0 text-muted-foreground transition-transform"
                aria-hidden
              />
            </summary>
            <p className="mt-2 leading-relaxed text-pretty text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * Call to action at the end of a guide, on the inverted (dark) section, with a button that says
 * what it does and for whom ("Criar meu link de barbearia") and the D1 note under it.
 */
export function GuideCta({
  title,
  niche,
  label = "Criar meu link de agendamento",
}: {
  title: string;
  niche?: string;
  label?: string;
}) {
  return (
    <aside className="lp-invert mt-14 flex flex-col items-start gap-4 rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
      <p className="lp-display font-heading text-3xl leading-tight font-semibold text-balance">
        {title}
      </p>
      <OpenCreationLink
        niche={niche}
        className="lp-press inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-background px-5 py-3 text-center font-semibold text-[color:var(--brand-text)] shadow-lg sm:w-auto"
      >
        {label}
      </OpenCreationLink>
      <p className="text-sm text-muted-foreground">{NOTE}</p>
    </aside>
  );
}
