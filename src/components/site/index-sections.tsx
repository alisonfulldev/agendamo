import type { GuideSection } from "@/content/niche-guides/types";

/**
 * Short explanatory sections of an index page (/comparar, /ferramentas, /recursos, /ajuda…),
 * below its list: what is there, for whom and how it is made. Titles phrased as questions.
 */
export function IndexSections({ sections }: { sections: readonly GuideSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
          {section.paragraphs?.map((p) => (
            <p key={p} className="mt-3 leading-relaxed text-pretty text-muted-foreground">
              {p}
            </p>
          ))}
          {section.list ? (
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}
