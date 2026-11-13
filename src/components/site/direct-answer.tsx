import type { DirectAnswer } from "@/content/direct-answer";
import { formatPageDate } from "@/content/site-pages";

/**
 * Direct answer near the top of a sales page (src/content/direct-answer.ts): the question as a
 * heading, 2 or 3 sentences and "Atualizado em" with a machine-readable date. `updatedAt` comes
 * from src/content/site-pages.ts (changes only when the content does).
 */
export function DirectAnswerBlock({
  answer,
  updatedAt,
  className = "",
}: {
  answer: DirectAnswer;
  /** YYYY-MM-DD. */
  updatedAt: string;
  className?: string;
}) {
  return (
    <section aria-labelledby="resposta-direta" className={className}>
      <div className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
        <h2 id="resposta-direta" className="text-xl font-bold tracking-tight">
          {answer.question}
        </h2>
        <p className="mt-2 leading-relaxed text-pretty">{answer.sentences.join(" ")}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Atualizado em <time dateTime={updatedAt}>{formatPageDate(updatedAt)}</time>
        </p>
      </div>
    </section>
  );
}
