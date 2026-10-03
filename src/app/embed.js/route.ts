import { getCurrentBrand, getRequestOrigin } from "@/brands/server";

/**
 * Embed script for external sites (Prompt 35). Links to this brand domain's business pages
 * (or <a data-lively-slug="...">) open the booking chat in a modal; without the script the link
 * still works as a normal link. Messages from the iframe are accepted only from this origin.
 */
export async function GET() {
  const origin = await getRequestOrigin();
  const brand = await getCurrentBrand();
  const { theme } = brand;
  const script = `(function () {
  if (window.__livelyEmbed) return;
  window.__livelyEmbed = true;
  var ORIGIN = ${JSON.stringify(origin)};
  var OVERLAY = ${JSON.stringify(`${theme.text}99`)};
  var SURFACE = ${JSON.stringify(theme.surface)};
  var SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
  var overlay = null;
  var lastFocus = null;

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.documentElement.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function open(slug) {
    close();
    lastFocus = document.activeElement;
    var mobile = window.matchMedia("(max-width: 640px)").matches;
    overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Agendamento");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:" + OVERLAY;
    var frame = document.createElement("iframe");
    frame.src = ORIGIN + "/" + slug + "/agendar?embed=1";
    frame.title = "Agendamento";
    frame.allow = "clipboard-write";
    frame.style.cssText = mobile
      ? "width:100%;height:100%;border:0;background:" + SURFACE
      : "width:440px;max-width:95vw;height:680px;max-height:90vh;border:0;border-radius:16px;background:" + SURFACE;
    overlay.appendChild(frame);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) close(); });
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";
    frame.focus();
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== ORIGIN || !event.data || typeof event.data !== "object") return;
    if (event.data.type === "lively:close") close();
    if (event.data.type === "lively:height" && overlay && !window.matchMedia("(max-width: 640px)").matches) {
      var h = Math.min(Number(event.data.height) || 680, window.innerHeight * 0.9);
      overlay.firstChild.style.height = h + "px";
    }
  });

  document.addEventListener("keydown", function (event) { if (event.key === "Escape") close(); });

  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest ? event.target.closest("a") : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    var slug = link.getAttribute("data-lively-slug");
    if (!slug && link.href && link.href.indexOf(ORIGIN + "/") === 0) {
      slug = new URL(link.href).pathname.split("/")[1];
    }
    if (!slug || !SLUG.test(slug)) return;
    event.preventDefault();
    open(slug);
  });
})();
`;
  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
