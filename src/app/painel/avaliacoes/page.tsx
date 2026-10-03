import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";

import { ActionButton } from "@/components/panel/action-button";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/lib/business/context";
import type { Review } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

import { setReviewHiddenAction } from "./actions";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = { title: "Avaliações" };

export default async function ReviewsPage() {
  const { business } = await requireOwner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, customer:customers(name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  const reviews = (data ?? []) as (Review & { customer: { name: string } | null })[];
  const visible = reviews.filter((r) => !r.hidden);
  const average = visible.length
    ? visible.reduce((s, r) => s + r.rating, 0) / visible.length
    : null;

  return (
    <div>
      <PageHeader
        title="Avaliações"
        description={
          average !== null
            ? `Nota ${average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5 · ${visible.length} avaliações visíveis. Só clientes com atendimento concluído avaliam, uma vez.`
            : "Depois de cada atendimento concluído, a cliente recebe um link para avaliar."
        }
      />
      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Nenhuma avaliação ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className={`flex flex-col gap-3 rounded-xl border bg-card p-4 ${review.hidden ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  <span className="font-medium">{review.customer?.name ?? "Cliente"}</span>{" "}
                  <span className="text-primary" aria-label={`${review.rating} de 5`}>
                    {"★".repeat(review.rating)}
                  </span>{" "}
                  {review.hidden ? <Badge variant="secondary">Oculta</Badge> : null}
                </p>
                <span className="text-sm text-muted-foreground">
                  {formatInTimeZone(new Date(review.created_at), business.timezone, "dd/MM/yyyy")}
                </span>
              </div>
              {review.comment ? <p>{review.comment}</p> : null}
              <ReplyForm id={review.id} reply={review.reply} />
              <ActionButton
                size="sm"
                variant="ghost"
                className="self-start"
                action={setReviewHiddenAction.bind(null, review.id, !review.hidden)}
              >
                {review.hidden ? "Mostrar no perfil" : "Ocultar do perfil"}
              </ActionButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
