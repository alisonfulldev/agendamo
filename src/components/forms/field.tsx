import type { ComponentProps, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";

interface FieldShellProps {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

/** Label + control + hint/error, with ids wired for screen readers. */
export function FieldShell({ name, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<ComponentProps<typeof Input>, "name"> & {
  name: string;
  label: string;
  hint?: ReactNode;
  state?: FormState;
};

export function TextField({
  name,
  label,
  hint,
  state,
  defaultValue,
  className,
  ...props
}: TextFieldProps) {
  const error = state?.errors?.[name];
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <Input
        id={name}
        name={name}
        defaultValue={state?.values?.[name] ?? defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={`h-10 ${className ?? ""}`}
        {...props}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<typeof Textarea>, "name"> & {
  name: string;
  label: string;
  hint?: ReactNode;
  state?: FormState;
};

export function TextAreaField({
  name,
  label,
  hint,
  state,
  defaultValue,
  ...props
}: TextAreaFieldProps) {
  const error = state?.errors?.[name];
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <Textarea
        id={name}
        name={name}
        defaultValue={state?.values?.[name] ?? defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

/** Status line for a form (success or error), announced to screen readers. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}
    >
      {state.message}
    </p>
  );
}
