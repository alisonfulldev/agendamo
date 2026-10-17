import { ChevronDown } from "lucide-react";
import type React from "react";
import Link from "next/link";

import { OpenCreationLink } from "@/components/creation/open-creation";
import type { FaqItem, GuideSection } from "@/content/niche-guides/types";
import { HOME } from "@/content/home";
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
      <h1 className="mt-6 font-heading text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
        {h1}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Atualizado em {formatPageDate(updatedAt)}
      </p>
      <p className="mt-6 text-lg leading-relaxed text-pretty">{answer}</p>
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

/** Call to action box: opens the creation conversation (with the niche preset when given). */
export function GuideCta({ title, niche }: { title: string; niche?: string }) {
  return (
    <aside className="site-cta-panel mt-12 flex flex-col items-start gap-3 rounded-3xl px-6 py-10 text-primary-foreground">
      <p className="text-2xl font-bold tracking-tight text-balance">{title}</p>
      <OpenCreationLink
        niche={niche}
        className="flex h-12 items-center justify-center rounded-xl bg-background px-6 font-semibold text-foreground shadow-lg"
      >
        {HOME.hero.primaryCta}
      </OpenCreationLink>
      <p className="text-sm opacity-90">{HOME.hero.note}</p>
    </aside>
  );
}
