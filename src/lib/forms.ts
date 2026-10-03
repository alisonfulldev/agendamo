import type { z } from "zod";

/** Result of a form Server Action, consumed with useActionState. */
export interface FormState {
  ok?: boolean;
  message?: string;
  /** Field name -> first error message. */
  errors?: Record<string, string>;
  /** Echo of submitted values so fields keep their content after an error. */
  values?: Record<string, string>;
}

export const initialFormState: FormState = {};

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Plain object of string fields from FormData (files ignored). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  }
  return values;
}

export function invalid(
  error: z.ZodError,
  formData: FormData,
  message = "Confira os campos destacados.",
): FormState {
  return { ok: false, message, errors: fieldErrors(error), values: formValues(formData) };
}
