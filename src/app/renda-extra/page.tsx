import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, breadcrumbTrailNode } from "@/components/site/breadcrumbs";
import { PartnerCta } from "@/components/site/partner-cta";
import { SitePage } from "@/components/site/site-page";
import { INCOME_INDEX, INCOME_PAGES } from "@/content/income-pages";
import { PARTNERS } from "@/content/partners";
import { formatPageDate } from "@/content/site-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqNode, itemListNode, organizationNode } from "@/lib/seo/structured-data";
import { siteUrl, withoutQuery } from "@/lib/site-url";

const PATH = "/renda-extra";
const CRUMBS = [{ name: "Renda extra", path: PATH }];

export const metadata = pageMetadata({
  title: INCOME_INDEX.title,
  description: INCOME_INDEX.description,
  path: PATH,
  socialTitle: INCOME_INDEX.h1,
});

/** Hub of the income pages (/renda-extra): the program in short and every long-tail page. */
export default function IncomeIndexPage() {
  const faq = PARTNERS.faq.slice(0, 6).map((f) => ({ question: f.question, answer: f.answer }));
  return (
    <SitePage template="outro">
      <Breadcrumbs items={CRUMBS} jsonLd={false} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {INCOME_INDEX.h1}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Atualizado em{" "}
        <time dateTime={INCOME_INDEX.updatedAt}>{formatPageDate(INCOME_INDEX.updatedAt)}</time>
      </p>
      <p className="mt-6 text-lg leading-relaxed text-pretty text-muted-foreground">
        {INCOME_INDEX.intro}
      </p>
      <p className="mt-4">
        <Link href="/parceiros" className="font-medium text-primary hover:underline">
          Ver como funciona o programa de parceiros, as regras e a simulação
        </Link>
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">Guias de renda extra</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {INCOME_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/renda-extra/${page.slug}`}
              className="flex h-full flex-col gap-1 rounded-2xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <span className="font-semibold">{page.h1}</span>
              <span className="text-sm text-muted-foreground">{page.description}</span>
            </Link>
          </li>
        ))}
      </ul>

      <PartnerCta />

      <section aria-labelledby="duvidas" className="mt-14">
        <h2 id="duvidas" className="text-2xl font-bold tracking-tight">
          Perguntas frequentes
        </h2>
        <div className="mt-6 flex flex-col gap-6">
          {faq.map((item) => (
            <div key={item.question}>
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-1 leading-relaxed text-pretty text-muted-foreground">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <JsonLd
        nodes={[
          organizationNode(),
          breadcrumbTrailNode(CRUMBS),
          itemListNode(
            INCOME_PAGES.map((p) => ({
              name: p.h1,
              url: withoutQuery(siteUrl(`/renda-extra/${p.slug}`)),
            })),
          ),
          faqNode(faq),
        ]}
      />
    </SitePage>
  );
}
