/** Between panel pages: the menu stays, the content area shows this until the page is ready. */
export default function PanelLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <span
        className="size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none"
        aria-hidden
      />
      <span className="text-sm">Carregando…</span>
    </div>
  );
}
