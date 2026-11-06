"use client";

import { ArrowRight, BookOpen, CircleHelp, Mail, Send, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  SUPPORT_COPY,
  SUPPORT_EMAIL,
  SUPPORT_ITEMS,
  type SupportItem,
  type SupportTarget,
} from "@/content/support";
import { suggestionsFor, understand, visibleSupport } from "@/lib/support-search";

import { usePanelWords } from "./use-panel-words";

/** Screens that stay open in waiting mode (subscription and account). */
const WAITING_OPEN = ["/painel/plano", "/painel/conta"];

type Message =
  | { from: "user"; text: string }
  | { from: "bot"; text: string }
  | { from: "answer"; item: SupportItem; related: SupportItem[] }
  | { from: "choices"; text?: string; items: SupportItem[]; contact?: boolean };

/** Finds the field (name), the section (its title) or the tour target of a help answer. */
function findTarget(target: SupportTarget): HTMLElement | null {
  const visible = (el: Element | null): el is HTMLElement =>
    el instanceof HTMLElement && el.offsetParent !== null;
  if (target.field) {
    const field = document.querySelector(`[name="${target.field}"]`);
    if (visible(field)) return field;
  }
  if (target.section) {
    const heading = [...document.querySelectorAll("h2")].find(
      (h) => h.textContent?.trim() === target.section,
    );
    const section = heading?.closest("section") ?? heading ?? null;
    if (visible(section)) return section;
  }
  if (target.tour) {
    const el = [...document.querySelectorAll(`[data-tour="${target.tour}"]`)].find(visible);
    if (el) return el as HTMLElement;
  }
  return null;
}

/**
 * Panel help chat (no AI): ready answers from src/content/support.ts, searched in the browser.
 * "Ir para lá" opens the screen and highlights the section or field.
 */
export function HelpChat({ isOwner, waiting }: { isOwner: boolean; waiting: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = usePanelWords();
  // Answers in the niche's words (paciente, aluno…); the original keywords still match.
  const items = useMemo(
    () =>
      visibleSupport(SUPPORT_ITEMS, isOwner).map((item) => ({
        ...item,
        question: t(item.question),
        answer: t(item.answer),
        keywords: [...new Set([...item.keywords, ...item.keywords.map(t)])],
        target: item.target?.section
          ? { ...item.target, section: t(item.target.section) }
          : item.target,
      })),
    [isOwner, t],
  );
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<SupportTarget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastQuestion, setLastQuestion] = useState("");

  // Highlight the destination once the screen shows it (waits for navigation and rendering).
  useEffect(() => {
    if (!pending) return;
    let tries = 0;
    const timer = setInterval(() => {
      const el = findTarget(pending);
      if (!el && ++tries < 30) return;
      clearInterval(timer);
      setPending(null);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // An attribute React does not manage (a class would be overwritten when the new screen
      // finishes rendering), set a moment later for the same reason.
      setTimeout(() => {
        const target = findTarget(pending) ?? el;
        target.removeAttribute("data-help-flash");
        void target.offsetWidth;
        target.setAttribute("data-help-flash", "");
        if (target.matches("input, select, textarea")) target.focus({ preventScroll: true });
        setTimeout(() => target.removeAttribute("data-help-flash"), 2600);
      }, 250);
    }, 150);
    return () => clearInterval(timer);
  }, [pending, pathname]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function start() {
    // Only the greeting: the person writes first (options come up only when they help).
    if (!messages.length) setMessages([{ from: "bot", text: SUPPORT_COPY.greeting }]);
    setOpen(true);
  }

  /** `others`: the next matches of a typed question (else answers about the same screen). */
  function answer(item: SupportItem, asked?: string, others?: SupportItem[]) {
    setLastQuestion(asked ?? item.question);
    const related = (others ?? items.filter((i) => i.id !== item.id && i.href === item.href)).slice(
      0,
      2,
    );
    setMessages((m) => [
      ...m,
      { from: "user", text: asked ?? item.question },
      { from: "answer", item, related },
    ]);
  }

  function ask(text: string) {
    const typed = text.trim();
    if (!typed) return;
    setQuery("");
    const result = understand(items, typed);
    if (result.kind === "answer") {
      answer(result.item, typed, result.others);
      return;
    }
    setLastQuestion(typed);
    const reply: Message =
      result.kind === "choose"
        ? { from: "choices", text: SUPPORT_COPY.choose, items: result.items }
        : result.kind === "greeting"
          ? { from: "bot", text: SUPPORT_COPY.hello }
          : result.kind === "thanks"
            ? { from: "bot", text: SUPPORT_COPY.thanks }
            : result.kind === "vague"
              ? { from: "bot", text: SUPPORT_COPY.vague }
              : {
                  from: "choices",
                  text: SUPPORT_COPY.notFound,
                  items: suggestionsFor(items, pathname),
                  contact: true,
                };
    setMessages((m) => [...m, { from: "user", text: typed }, reply]);
  }

  function go(item: SupportItem) {
    if (!item.href) return;
    const blocked = waiting && !WAITING_OPEN.some((p) => item.href!.startsWith(p));
    setOpen(false);
    if (blocked) {
      router.push("/painel/plano");
      return;
    }
    if (item.target) setPending(item.target);
    if (pathname !== item.href) router.push(item.href);
  }

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Ajuda no painel do MeetChat",
  )}&body=${encodeURIComponent(`Minha dúvida: ${lastQuestion}\n\n(Tela: ${pathname})`)}`;

  const chip =
    "rounded-full border bg-card px-3 py-2 text-left text-sm font-medium transition-colors hover:border-primary";

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={start}
          className="fixed right-4 bottom-24 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 md:right-6 md:bottom-6"
        >
          <CircleHelp className="size-5" aria-hidden />
          {SUPPORT_COPY.title}
        </button>
      ) : null}
      {open ? (
        <div
          role="dialog"
          aria-label={SUPPORT_COPY.title}
          className="fixed inset-x-3 bottom-24 z-50 flex max-h-[72vh] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl md:inset-x-auto md:right-6 md:bottom-6 md:w-[390px]"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <CircleHelp className="size-6 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{SUPPORT_COPY.title}</span>
              <span className="block text-xs opacity-85">{SUPPORT_COPY.subtitle}</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="flex size-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
            >
              <X className="size-5" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-muted p-3"
          >
            {messages.map((message, i) => {
              if (message.from === "user") {
                return (
                  <p
                    key={i}
                    className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-3.5 py-2 text-[15px] text-primary-foreground"
                  >
                    {message.text}
                  </p>
                );
              }
              if (message.from === "bot") {
                return (
                  <p
                    key={i}
                    className="max-w-[88%] rounded-2xl rounded-tl-md bg-card px-3.5 py-2 text-[15px] shadow-sm"
                  >
                    {message.text}
                  </p>
                );
              }
              if (message.from === "answer") {
                const { item, related } = message;
                const blocked =
                  waiting && item.href && !WAITING_OPEN.some((p) => item.href!.startsWith(p));
                return (
                  <div
                    key={i}
                    className="flex max-w-[92%] flex-col gap-2.5 rounded-2xl rounded-tl-md bg-card px-3.5 py-3 text-[15px] shadow-sm"
                  >
                    <p className="leading-relaxed">{item.answer}</p>
                    {blocked ? (
                      <p className="text-sm text-muted-foreground">{SUPPORT_COPY.waiting}</p>
                    ) : null}
                    {item.href ? (
                      <button
                        type="button"
                        onClick={() => go(item)}
                        className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        {blocked ? "Ver assinatura" : SUPPORT_COPY.go}
                        <ArrowRight className="size-4" aria-hidden />
                      </button>
                    ) : null}
                    {item.article ? (
                      <a
                        href={item.article}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <BookOpen className="size-4" aria-hidden />
                        {SUPPORT_COPY.article}
                      </a>
                    ) : null}
                    {related.length ? (
                      <div className="flex flex-col gap-1.5 border-t pt-2.5">
                        <span className="text-xs text-muted-foreground">
                          {SUPPORT_COPY.related}
                        </span>
                        {related.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => answer(r)}
                            className="text-left text-sm font-medium text-primary hover:underline"
                          >
                            {r.question}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }
              return (
                <div key={i} className="flex flex-col gap-2">
                  {message.text ? (
                    <p className="max-w-[88%] rounded-2xl rounded-tl-md bg-card px-3.5 py-2 text-[15px] shadow-sm">
                      {message.text}
                    </p>
                  ) : null}
                  {message.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => answer(item)}
                      className={chip}
                    >
                      {item.question}
                    </button>
                  ))}
                  {message.contact ? (
                    <a
                      href={mailto}
                      className="flex items-center gap-2 rounded-2xl border border-dashed bg-card px-3 py-2.5 text-sm"
                    >
                      <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                      <span>
                        <span className="block font-semibold">{SUPPORT_COPY.contact}</span>
                        <span className="block text-xs text-muted-foreground">
                          {SUPPORT_COPY.contactHint}
                        </span>
                      </span>
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>

          <form
            className="flex items-center gap-2 border-t bg-background p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              ask(query);
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SUPPORT_COPY.placeholder}
              aria-label="Sua dúvida"
              maxLength={200}
              className="h-11 min-w-0 flex-1 rounded-full border bg-card px-4 text-[15px] outline-none focus:border-primary"
            />
            <button
              type="submit"
              aria-label="Enviar"
              disabled={!query.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden />
            </button>
          </form>
          <button
            type="button"
            onClick={() =>
              setMessages((m) => {
                // Questions not shown yet in this conversation (then starts over).
                const shown = new Set(
                  m.flatMap((x) =>
                    x.from === "choices"
                      ? x.items.map((i) => i.id)
                      : x.from === "answer"
                        ? [x.item.id]
                        : [],
                  ),
                );
                const fresh = items.filter((i) => !shown.has(i.id));
                return [
                  ...m,
                  {
                    from: "choices",
                    text: SUPPORT_COPY.more,
                    items: (fresh.length ? fresh : items).slice(0, 6),
                  },
                ];
              })
            }
            className="border-t bg-background py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {SUPPORT_COPY.more}
          </button>
        </div>
      ) : null}
    </>
  );
}
