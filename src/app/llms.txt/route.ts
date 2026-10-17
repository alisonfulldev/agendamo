import { llmsTxt } from "@/lib/seo/llms";

/**
 * /llms.txt (experimental, llmstxt.org): a short Markdown map of the site's main pages for AI
 * tools. Built from the same content files as the pages, so it never drifts from them.
 */
export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
