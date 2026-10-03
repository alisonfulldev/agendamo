"use client";

import { useActionState, useState } from "react";

import type { BrandConfig } from "@/brands";
import { contrastRatio, readableOn } from "@/brands/theme";
import { FieldShell, FormMessage, TextAreaField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { PageSettings } from "@/lib/db/types";
import { initialFormState } from "@/lib/forms";
import { formatBrPhone, maskBrPhone } from "@/lib/phone";
import { instagramHandle } from "@/lib/social";

import { savePageInfoAction } from "./actions";

export function PageInfoForm({
  settings,
  theme,
}: {
  settings: PageSettings | null;
  theme: BrandConfig["theme"];
}) {
  const [state, action] = useActionState(savePageInfoAction, initialFormState);
  const [color, setColor] = useState(settings?.primary_color_override ?? "");
  const [whatsapp, setWhatsapp] = useState(formatBrPhone(settings?.whatsapp_number));
  const effective = color || theme.primary;
  const onButton = contrastRatio(effective, readableOn(effective, theme));
  const onBackground = contrastRatio(effective, theme.background);
  const poorContrast = onButton < 4.5 || onBackground < 3;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <TextAreaField
        name="bio"
        label="Bio"
        rows={3}
        maxLength={500}
        defaultValue={settings?.bio ?? ""}
        hint="Conte em poucas palavras o que você faz."
        state={state}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell name="whatsapp" label="WhatsApp" error={state.errors?.whatsapp}>
          <Input
            id="whatsapp"
            name="whatsapp"
            inputMode="tel"
            placeholder="(11) 99999-8888"
            value={whatsapp}
            onChange={(e) => setWhatsapp(maskBrPhone(e.target.value))}
            className="h-10"
          />
        </FieldShell>
        <TextField
          name="instagram"
          label="Instagram"
          placeholder="@seuperfil"
          defaultValue={instagramHandle(settings?.instagram_url) ?? ""}
          state={state}
        />
        <div className="sm:col-span-2">
          <TextField
            name="address"
            label="Endereço"
            defaultValue={settings?.address ?? ""}
            state={state}
          />
        </div>
        <TextField name="city" label="Cidade" defaultValue={settings?.city ?? ""} state={state} />
        <TextField
          name="neighborhood"
          label="Bairro"
          defaultValue={settings?.neighborhood ?? ""}
          state={state}
        />
        <div className="sm:col-span-2">
          <TextField
            name="google_review_url"
            label="Link para avaliar no Google"
            placeholder="https://g.page/r/..."
            defaultValue={settings?.google_review_url ?? ""}
            hint="Usado para convidar clientes satisfeitas a avaliar você no Google."
            state={state}
          />
        </div>
      </div>

      <FieldShell
        name="primary_color_override"
        label="Cor principal"
        error={state.errors?.primary_color_override}
        hint={color ? "Cor personalizada." : "Usando a cor padrão da marca."}
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="primary_color_override"
            type="color"
            value={effective}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded-lg border bg-transparent"
          />
          <input type="hidden" name="primary_color_override" value={color} />
          <span
            className="rounded-lg px-3 py-2 text-sm font-medium"
            style={{ background: effective, color: readableOn(effective, theme) }}
          >
            Exemplo de botão
          </span>
          {color ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setColor("")}>
              Usar cor da marca
            </Button>
          ) : null}
        </div>
      </FieldShell>
      {poorContrast ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Essa cor tem pouco contraste: textos e botões podem ficar difíceis de ler. Prefira uma cor
          mais escura ou mais clara.
        </p>
      ) : null}

      <label className="flex items-center justify-between gap-3 rounded-xl border p-3">
        <span>
          <span className="font-medium">Mostrar preços</span>
          <span className="block text-sm text-muted-foreground">
            Exibe o valor de cada serviço no chat e no perfil.
          </span>
        </span>
        <Switch name="show_prices" defaultChecked={settings?.show_prices ?? true} />
      </label>

      <FormMessage state={state} />
      <SubmitButton className="self-start" pendingLabel="Salvando…">
        Salvar
      </SubmitButton>
    </form>
  );
}
