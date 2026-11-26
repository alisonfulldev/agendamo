import { CalendarPlus } from "lucide-react";

/**
 * "Salvar na agenda do celular": the customer's own calendar reminds them of the appointment (the
 * calendar file has alarms 1 day and 2 hours before). Replaces the reminder e-mail (2026-11-26).
 */
export function CalendarSave({
  googleCalendarUrl,
  cancelToken,
  linkClass,
}: {
  googleCalendarUrl: string | null;
  cancelToken: string;
  linkClass: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-accent/60 p-2">
      <p className="px-1 text-sm font-medium text-accent-foreground">
        Salve na agenda do celular: ela te lembra do horário.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {googleCalendarUrl ? (
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <CalendarPlus className="size-4" aria-hidden /> Google Agenda
          </a>
        ) : null}
        <a href={`/api/ics/${cancelToken}`} className={linkClass}>
          <CalendarPlus className="size-4" aria-hidden /> Agenda do iPhone
        </a>
      </div>
    </div>
  );
}
