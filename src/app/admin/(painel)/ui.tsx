import type { ReactNode } from "react";

import { ADMIN_STATUS_LABEL, type AdminStatus } from "@/lib/admin-metrics";

/** One headline number (no chart): label, value and an optional note under it. */
export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 text-card-foreground">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function AdminSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 text-card-foreground">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/**
 * Single-series bars (one hue, the brand's primary): thin bars with a 2px gap, rounded ends on
 * the baseline side up, a recessive baseline, the total and the peak as text, and a per-bar
 * tooltip (title) with the exact value. The list of values is also available to screen readers.
 */
export function BarChart({
  data,
  label,
  formatKey,
}: {
  data: { key: string; value: number }[];
  /** What is counted ("cadastros", "agendamentos"). */
  label: string;
  /** Label of a bar in the tooltip and the axis ("12/10"). */
  formatKey: (key: string) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const first = data[0];
  const last = data.at(-1);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm text-muted-foreground">
        Total: <span className="font-medium text-foreground tabular-nums">{total}</span> {label}
      </figcaption>
      <div
        role="img"
        aria-label={`${label}: ${data.map((d) => `${formatKey(d.key)} ${d.value}`).join(", ")}`}
        className="flex h-28 items-end gap-0.5 border-b border-border"
      >
        {data.map((d) => (
          <div
            key={d.key}
            title={`${formatKey(d.key)}: ${d.value} ${label}`}
            className="group relative flex h-full flex-1 items-end"
          >
            <div
              className="w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80"
              style={{ height: d.value ? `${Math.max(4, (d.value / max) * 100)}%` : "0" }}
            />
          </div>
        ))}
      </div>
      {first && last ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatKey(first.key)}</span>
          <span>{formatKey(last.key)}</span>
        </div>
      ) : null}
    </figure>
  );
}

const STATUS_CLASS: Record<AdminStatus, string> = {
  subscribed: "bg-primary text-primary-foreground",
  trial: "bg-accent text-accent-foreground",
  waiting: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/10 text-destructive",
};

/** Situation of a business: color plus the written label (never color alone). */
export function StatusBadge({ status }: { status: AdminStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_CLASS[status]}`}
    >
      {ADMIN_STATUS_LABEL[status]}
    </span>
  );
}

/** "12/10" from "2026-10-12". */
export const dayMonth = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;
