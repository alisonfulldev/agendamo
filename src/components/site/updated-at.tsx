import { formatPageDate } from "@/content/site-pages";

/**
 * "Atualizado em 13/11/2026" with a machine-readable <time>. `date` (YYYY-MM-DD) comes from the
 * page's content file and changes only when its content does (never the deploy date).
 */
export function UpdatedAt({ date, className = "" }: { date: string; className?: string }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      Atualizado em <time dateTime={date}>{formatPageDate(date)}</time>
    </p>
  );
}
