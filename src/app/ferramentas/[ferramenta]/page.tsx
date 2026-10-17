import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NICHES } from "@/brands";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideCta, GuideFaq } from "@/components/site/guide-article";
import { LinkList } from "@/components/site/link-list";
import { SitePage } from "@/components/site/site-page";
import { BioGenerator } from "@/components/tools/bio-generator";
import { MessageGenerator, type MessageNiche } from "@/components/tools/message-generator";
import { NoShowCalculator } from "@/components/tools/no-show-calculator";
import { formatPageDate } from "@/content/site-pages";
import { getTool, TOOLS, type ToolPage } from "@/content/tools";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqNode, organizationNode, toolNode } from "@/lib/seo/structured-data";
import { siteUrl, withoutQuery } from "@/lib/site-url";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ ferramenta: tool.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/ferramentas/[ferramenta]">): Promise<Metadata> {
  const tool = getTool((await params).ferramenta);
  if (!tool) return {};
  return pageMetadata({
    title: tool.title,
    description: tool.description,
    path: `/ferramentas/${tool.slug}`,
    socialTitle: tool.h1,
  });
}

/** Niche vocabulary for the message generator ("sessão" is feminine, "horário" masculine). */
function messageNiches(): MessageNiche[] {
  return NICHES.map((brand) => {
    const word = brand.terms.appointment.singular;
    return {
      key: brand.key,
      name: brand.niche!.name,
      appointment: word,
      article: /(a|ão)$/.test(word) ? "a" : "o",
      formal: brand.terms.customer.singular === "paciente",
    };
  });
}

function Tool({ slug }: { slug: ToolPage["slug"] }) {
  switch (slug) {
    case "calculadora-de-faltas":
      return <NoShowCalculator />;
    case "mensagens-whatsapp":
      return <MessageGenerator niches={messageNiches()} />;
    case "bio-instagram":
      return <BioGenerator areas={NICHES.map((b) => b.niche!.label)} />;
  }
}

/** A free tool (/ferramentas/calculadora-de-faltas…), texts in src/content/tools.ts. */
export default async function ToolRoute({ params }: PageProps<"/ferramentas/[ferramenta]">) {
  const tool = getTool((await params).ferramenta);
  if (!tool) notFound();
  const path = `/ferramentas/${tool.slug}`;
  const others = TOOLS.filter((t) => t.slug !== tool.slug).map((t) => ({
    label: t.label,
    href: `/ferramentas/${t.slug}`,
  }));

  return (
    <SitePage template="ferramenta" wide>
      <Breadcrumbs
        items={[
          { name: "Ferramentas", path: "/ferramentas" },
          { name: tool.label, path },
        ]}
      />
      <div className="max-w-3xl">
        <h1 className="mt-6 font-heading text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
          {tool.h1}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atualizado em {formatPageDate(tool.updatedAt)}
        </p>
        <p className="mt-6 text-lg leading-relaxed text-pretty">{tool.answer}</p>
      </div>
      <Tool slug={tool.slug} />
      <div className="max-w-3xl">
        {tool.sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-3 text-lg leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {section.list ? (
              <ul className="mt-4 flex list-disc flex-col gap-2 pl-6 text-lg text-muted-foreground marker:text-primary">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
        <GuideCta title="Quer que o cliente marque sozinho? Seu link fica pronto em 1 minuto." />
        <GuideFaq items={tool.faq} />
        <LinkList id="outras" title="Outras ferramentas" links={others} />
      </div>
      <JsonLd
        nodes={[
          organizationNode(),
          toolNode({
            name: tool.label,
            url: withoutQuery(siteUrl(path)),
            description: tool.description,
          }),
          faqNode(tool.faq),
        ]}
      />
    </SitePage>
  );
}
