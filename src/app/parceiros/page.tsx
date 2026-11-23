import { Check } from "lucide-react";
import Link from "next/link";

import { NICHES } from "@/brands";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs, breadcrumbTrailNode } from "@/components/site/breadcrumbs";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LinkList } from "@/components/site/link-list";
import { SitePage } from "@/components/site/site-page";
import { INCOME_PAGES } from "@/content/income-pages";
import { Button } from "@/components/ui/button";
import { PARTNER_TERMS, PARTNERS } from "@/content/partners";
import { formatPageDate } from "@/content/site-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { passesQualityGate } from "@/lib/seo/quality";
import { faqNode, ORGANIZATION_ID, organizationNode, WEBSITE_ID } from "@/lib/seo/structured-data";
import { siteUrl, withoutQuery } from "@/lib/site-url";

const PATH = "/parceiros";
const CRUMBS = [{ name: "Programa de parceiros", path: PATH }];

export const metadata = pageMetadata({
  title: PARTNERS.title,
  description: PARTNERS.description,
  path: PATH,
  socialTitle: PARTNERS.h1,
});

/** /parceiros: how the partner program works, with the sign-up (src/content/partners.ts). */
export default function PartnersPage() {
  const url = withoutQuery(siteUrl(PATH));
  const niches = NICHES.filter((b) => passesQualityGate(`/${b.niche!.route}`));
  const faq = PARTNERS.faq.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <SitePage template="outro">
      <Breadcrumbs items={CRUMBS} jsonLd={false} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {PARTNERS.h1}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">
        {PARTNERS.lead}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{PARTNERS.goalNote}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/parceiros/cadastro">{PARTNERS.cta}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/parceiros/entrar">{PARTNERS.login}</Link>
        </Button>
      </div>

      <DirectAnswerBlock
        answer={PARTNERS.answer}
        updatedAt={PARTNERS.updatedAt}
        className="mt-10"
      />

      <section aria-labelledby="como-funciona" className="mt-12">
        <h2 id="como-funciona" className="text-2xl font-bold tracking-tight">
          Como funciona
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {PARTNERS.steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border p-5">
              <p className="text-sm font-semibold text-primary">Passo {i + 1}</p>
              <h3 className="mt-1 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="comissao" className="mt-12">
        <h2 id="comissao" className="text-2xl font-bold tracking-tight">
          {PARTNERS.commissions.title}
        </h2>
        <p className="mt-3 text-muted-foreground">{PARTNERS.commissions.intro}</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <caption className="sr-only">Comissão do parceiro por plano do MeetChat</caption>
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Plano
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Mensalidade
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  1º pagamento
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Todo mês depois
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PARTNERS.commissions.rows.map((row) => (
                <tr key={row.plan}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {row.plan}
                  </th>
                  <td className="px-4 py-3">{row.price}</td>
                  <td className="px-4 py-3 font-semibold">{row.first}</td>
                  <td className="px-4 py-3 font-semibold">{row.recurring}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="simulacao" className="mt-12">
        <h2 id="simulacao" className="text-2xl font-bold tracking-tight">
          {PARTNERS.simulation.title}
        </h2>
        <p className="mt-3 text-muted-foreground">{PARTNERS.simulation.intro}</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <caption className="sr-only">Simulação de ganhos do parceiro em 12 meses</caption>
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Negócios indicados
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  1º pagamento
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Por mês depois
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Em 12 meses
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PARTNERS.simulation.rows.map((row) => (
                <tr key={row.clients}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {row.clients}
                  </th>
                  <td className="px-4 py-3">{row.firstMonth}</td>
                  <td className="px-4 py-3">{row.monthly}</td>
                  <td className="px-4 py-3 font-semibold">{row.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{PARTNERS.simulation.note}</p>
      </section>

      <section aria-labelledby="quem-pode" className="mt-12">
        <h2 id="quem-pode" className="text-2xl font-bold tracking-tight">
          {PARTNERS.who.title}
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {PARTNERS.who.items.map((item) => (
            <li key={item} className="flex gap-3">
              <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="produto" className="mt-12">
        <h2 id="produto" className="text-2xl font-bold tracking-tight">
          {PARTNERS.product.title}
        </h2>
        <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
          {PARTNERS.product.text}{" "}
          <Link href="/precos" className="font-medium text-primary hover:underline">
            Ver preços e planos
          </Link>
          .
        </p>
        <h3 className="mt-6 font-semibold">{PARTNERS.nichesTitle}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {niches.map((b) => (
            <li key={b.key}>
              <Link
                href={`/${b.niche!.route}`}
                className="inline-flex min-h-9 items-center rounded-full border px-3 text-sm hover:bg-muted"
              >
                {b.niche!.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="duvidas" className="mt-12">
        <h2 id="duvidas" className="text-2xl font-bold tracking-tight">
          {PARTNERS.faqTitle}
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

      <section aria-labelledby="regras" className="mt-12">
        <h2 id="regras" className="text-2xl font-bold tracking-tight">
          {PARTNERS.rulesTitle}
        </h2>
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          {PARTNER_TERMS.text.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <LinkList
        id="guias-renda-extra"
        title="Guias de renda extra"
        links={INCOME_PAGES.map((p) => ({ label: p.label, href: `/renda-extra/${p.slug}` }))}
      />

      <div className="mt-12 flex flex-col items-start gap-2">
        <Button asChild size="lg">
          <Link href="/parceiros/cadastro">{PARTNERS.cta}</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Atualizado em{" "}
          <time dateTime={PARTNERS.updatedAt}>{formatPageDate(PARTNERS.updatedAt)}</time>
        </p>
      </div>

      <JsonLd
        nodes={[
          organizationNode(),
          breadcrumbTrailNode(CRUMBS),
          {
            "@type": "WebPage",
            "@id": `${url}#page`,
            url,
            name: PARTNERS.title,
            description: PARTNERS.description,
            dateModified: PARTNERS.updatedAt,
            inLanguage: "pt-BR",
            isPartOf: { "@id": WEBSITE_ID },
            about: { "@id": ORGANIZATION_ID },
            publisher: { "@id": ORGANIZATION_ID },
            keywords:
              "renda extra, programa de parceiros, programa de afiliados, indique e ganhe, comissão recorrente, agenda online",
          },
          {
            "@type": "HowTo",
            name: PARTNERS.answer.question,
            description: PARTNERS.answer.sentences.join(" "),
            totalTime: "PT2M",
            estimatedCost: { "@type": "MonetaryAmount", currency: "BRL", value: "0" },
            step: PARTNERS.steps.map((step, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: step.title,
              text: step.text,
              url: `${url}#como-funciona`,
            })),
          },
          faqNode(faq),
        ]}
      />
    </SitePage>
  );
}
