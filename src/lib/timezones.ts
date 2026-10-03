/** Brazilian timezones (IANA), labelled for owners. */
export const BR_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Sao_Paulo", label: "Brasília (SP, RJ, MG, Sul, GO, DF, BA…)" },
  { value: "America/Manaus", label: "Amazonas (Manaus)" },
  { value: "America/Cuiaba", label: "Mato Grosso (Cuiabá)" },
  { value: "America/Campo_Grande", label: "Mato Grosso do Sul (Campo Grande)" },
  { value: "America/Porto_Velho", label: "Rondônia (Porto Velho)" },
  { value: "America/Boa_Vista", label: "Roraima (Boa Vista)" },
  { value: "America/Rio_Branco", label: "Acre (Rio Branco)" },
  { value: "America/Belem", label: "Pará (Belém)" },
  { value: "America/Santarem", label: "Pará (Santarém)" },
  { value: "America/Fortaleza", label: "Ceará, RN, PB, PI, MA" },
  { value: "America/Recife", label: "Pernambuco (Recife)" },
  { value: "America/Maceio", label: "Alagoas e Sergipe" },
  { value: "America/Bahia", label: "Bahia (Salvador)" },
  { value: "America/Araguaina", label: "Tocantins" },
  { value: "America/Noronha", label: "Fernando de Noronha" },
];

export const BR_TIMEZONE_VALUES = BR_TIMEZONES.map((t) => t.value) as [string, ...string[]];
