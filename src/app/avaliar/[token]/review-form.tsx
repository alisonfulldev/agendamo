"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { submitReviewAction } from "./actions";

export function ReviewForm({ token, businessName }: { token: string; businessName: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<{
    done: boolean;
    googleUrl: string | null;
    error: string | null;
  }>({ done: false, googleUrl: null, error: null });
  const [pending, startTransition] = useTransition();

  if (result.done) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <p className="text-xl font-bold">Obrigada pela avaliação!</p>
        {result.googleUrl ? (
          <>
            <p className="text-muted-foreground">
              Que bom que gostou! Pode deixar essa avaliação no Google também? Ajuda muito{" "}
              {businessName}.
            </p>
            <Button asChild className="h-11">
              <a href={result.googleUrl} target="_blank" rel="noopener noreferrer">
                Avaliar no Google
              </a>
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const response = await submitReviewAction({ token, rating, comment });
          setResult(
            response.ok
              ? { done: true, googleUrl: response.googleUrl, error: null }
              : { done: false, googleUrl: null, error: response.message },
          );
        });
      }}
    >
      <fieldset>
        <legend className="mb-2 font-medium">Sua nota</legend>
        <div role="radiogroup" aria-label="Nota de 1 a 5" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              className="rounded-md p-1"
            >
              <Star
                className={`size-9 ${value <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor="comment" className="font-medium">
        Quer contar como foi? (opcional)
      </label>
      <Textarea
        id="comment"
        rows={4}
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {result.error ? (
        <p role="alert" className="text-sm text-destructive">
          {result.error}
        </p>
      ) : null}
      <Button type="submit" className="h-11" disabled={rating === 0 || pending}>
        {pending ? "Enviando…" : "Enviar avaliação"}
      </Button>
    </form>
  );
}
