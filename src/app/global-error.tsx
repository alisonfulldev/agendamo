"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main style={{ padding: 32, fontFamily: "sans-serif" }}>
          <h1>Algo deu errado.</h1>
          <p>Tente recarregar a página.</p>
        </main>
      </body>
    </html>
  );
}
