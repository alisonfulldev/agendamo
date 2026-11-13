import { Breadcrumbs, breadcrumbTrailNode } from "@/components/site/breadcrumbs";
import { SitePage } from "@/components/site/site-page";
import { JsonLd } from "@/components/seo/json-ld";
import { ABOUT } from "@/content/about";
import { COMPANY } from "@/content/company";
import { CONTACT_EMAIL } from "@/content/contact";
import { formatPageDate, SITE_PAGES } from "@/content/site-pages";
import { pageMetadata } from "@/lib/seo/metadata";
import { ORGANIZATION_ID, organizationNode } from "@/lib/seo/structured-data";
import { siteUrl, withoutQuery } from "@/lib/site-url";

export const metadata = pageMetadata({
  title: ABOUT.title,
  description: ABOUT.description,
  path: SITE_PAGES.about.path,
});

/** /sobre: what MeetChat is, the problem it solves and who makes it (src/content/about.ts). */
export default function AboutPage() {
  const updatedAt = SITE_PAGES.about.updatedAt;
  return (
    <SitePage template="outro">
      <Breadcrumbs items={[{ name: ABOUT.h1, path: SITE_PAGES.about.path }]} jsonLd={false} />
      <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {ABOUT.h1}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Atualizado em <time dateTime={updatedAt}>{formatPageDate(updatedAt)}</time>
      </p>
      {ABOUT.sections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
          {section.paragraphs.map((p) => (
            <p key={p} className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground">
              {p}
            </p>
          ))}
        </section>
      ))}
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{ABOUT.company.title}</h2>
        {ABOUT.company.paragraphs.map((p) => (
          <p key={p} className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground">
            {p}
          </p>
        ))}
        <ul className="mt-4 flex flex-col gap-2">
          <li>
            <a href={COMPANY.aboutUrl} className="font-medium text-primary hover:underline">
              Conheça a {COMPANY.name}
            </a>
          </li>
          <li>
            <a href={COMPANY.portfolioUrl} className="font-medium text-primary hover:underline">
              O MeetChat no portfólio da {COMPANY.name}
            </a>
          </li>
          <li>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary hover:underline"
            >
              Fale com a gente: {CONTACT_EMAIL}
            </a>
          </li>
        </ul>
      </section>
      <JsonLd
        nodes={[
          organizationNode(),
          breadcrumbTrailNode([{ name: ABOUT.h1, path: SITE_PAGES.about.path }]),
          {
            "@type": "AboutPage",
            "@id": `${withoutQuery(siteUrl(SITE_PAGES.about.path))}#page`,
            url: withoutQuery(siteUrl(SITE_PAGES.about.path)),
            name: ABOUT.title,
            description: ABOUT.description,
            dateModified: updatedAt,
            inLanguage: "pt-BR",
            about: { "@id": ORGANIZATION_ID },
          },
        ]}
      />
    </SitePage>
  );
}
