import { jsonLdHtml } from "@/lib/seo/json-ld";
import { graph, type JsonLdNode } from "@/lib/seo/structured-data";

/** The page's structured data: one <script> with every node in a @graph. */
export function JsonLd({ nodes }: { nodes: (JsonLdNode | null | undefined | false)[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(graph(nodes)) }}
    />
  );
}
