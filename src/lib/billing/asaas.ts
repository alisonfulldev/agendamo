import "server-only";

import { randomUUID } from "node:crypto";

import QRCode from "qrcode";

import { isDemoMode } from "@/lib/demo/mode";
import { getServerEnv, requireServerEnv } from "@/lib/env";

// Asaas API v3 (docs.asaas.com/reference). Auth header: access_token.
// Own checkout: the owner never leaves the panel; Asaas only processes behind the scenes.

const BASE_URLS = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3",
} as const;

export type AsaasCycle = "MONTHLY" | "YEARLY";
export type AsaasBillingType = "PIX" | "CREDIT_CARD";

export interface AsaasSubscription {
  id: string;
  customer: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  billingType?: string;
  externalReference?: string | null;
}

export interface AsaasPayment {
  id: string;
  subscription?: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl: string;
  paymentDate?: string | null;
  billingType: string;
}

export interface AsaasPixQrCode {
  /** PNG image in base64 (without the data: prefix). */
  encodedImage: string;
  /** "Pix copia e cola". */
  payload: string;
  expirationDate: string;
}

export interface CardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CardHolderInput {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export class AsaasError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function isAsaasConfigured(): boolean {
  return isDemoMode() || Boolean(getServerEnv().ASAAS_API_KEY);
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const env = requireServerEnv("ASAAS_API_KEY");
  const response = await fetch(`${BASE_URLS[env.ASAAS_ENV]}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: env.ASAAS_API_KEY,
      "User-Agent": "MeetChat",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    // Asaas asks for a 60 s timeout on card operations (and no blind retries).
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    // Never include the request body here: it may carry card data.
    const errors = (json.errors as { description?: string }[] | undefined)
      ?.map((e) => e.description)
      .join("; ");
    throw new AsaasError(
      errors || `Asaas ${method} ${path} failed (${response.status})`,
      response.status,
    );
  }
  return json as T;
}

/** R$ value with two decimals, as Asaas expects (not cents). */
const reais = (cents: number) => Math.round(cents) / 100;

// ---------------------------------------------------------------------------
// Local demo: Asaas simulated in memory (no network). /demo can confirm payments.

interface DemoStore {
  __livelyDemoAsaas?: Map<string, AsaasPayment[]>;
}
const demoStore = globalThis as DemoStore;
const demoPayments = () => (demoStore.__livelyDemoAsaas ??= new Map());

function demoPayment(subscriptionId: string, cents: number, billingType: string): AsaasPayment {
  const payment: AsaasPayment = {
    id: `pay_demo_${randomUUID().slice(0, 8)}`,
    subscription: subscriptionId,
    status: "PENDING",
    value: reais(cents),
    dueDate: new Date().toISOString().slice(0, 10),
    invoiceUrl: "",
    billingType,
  };
  demoPayments().set(subscriptionId, [payment, ...(demoPayments().get(subscriptionId) ?? [])]);
  return payment;
}

// ---------------------------------------------------------------------------

export function createCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone?: string | null;
  externalReference: string;
}) {
  if (isDemoMode()) return Promise.resolve({ id: `cus_demo_${randomUUID().slice(0, 8)}` });
  return request<{ id: string }>("POST", "/customers", {
    ...input,
    // Our own e-mails and the panel replace the Asaas invoice e-mails.
    notificationDisabled: true,
  });
}

/** Stores the card at Asaas and returns a token bound to the customer (card data never kept here). */
export async function tokenizeCreditCard(input: {
  customer: string;
  card: CardInput;
  holder: CardHolderInput;
  remoteIp: string;
}): Promise<{ creditCardToken: string; creditCardNumber: string; creditCardBrand: string }> {
  if (isDemoMode()) {
    if (input.card.number.endsWith("0000"))
      throw new AsaasError("Cartão recusado (simulação).", 400);
    return {
      creditCardToken: `tok_demo_${randomUUID().slice(0, 8)}`,
      creditCardNumber: input.card.number.slice(-4),
      creditCardBrand: input.card.number.startsWith("4") ? "VISA" : "MASTERCARD",
    };
  }
  return request("POST", "/creditCard/tokenizeCreditCard", {
    customer: input.customer,
    creditCard: input.card,
    creditCardHolderInfo: input.holder,
    remoteIp: input.remoteIp,
  });
}

export async function createSubscription(input: {
  customer: string;
  valueCents: number;
  cycle: AsaasCycle;
  nextDueDate: string;
  description: string;
  externalReference: string;
  billingType: AsaasBillingType;
  creditCardToken?: string;
  remoteIp?: string;
}): Promise<AsaasSubscription> {
  if (isDemoMode()) {
    const id = `sub_demo_${randomUUID().slice(0, 8)}`;
    demoPayment(id, input.valueCents, input.billingType);
    return {
      id,
      customer: input.customer,
      status: "ACTIVE",
      value: reais(input.valueCents),
      nextDueDate: input.nextDueDate,
      cycle: input.cycle,
      billingType: input.billingType,
    };
  }
  return request<AsaasSubscription>("POST", "/subscriptions", {
    customer: input.customer,
    billingType: input.billingType,
    value: reais(input.valueCents),
    nextDueDate: input.nextDueDate,
    cycle: input.cycle,
    description: input.description,
    externalReference: input.externalReference,
    ...(input.billingType === "CREDIT_CARD"
      ? { creditCardToken: input.creditCardToken, remoteIp: input.remoteIp }
      : {}),
  });
}

export function updateSubscription(
  id: string,
  input: {
    valueCents?: number;
    cycle?: AsaasCycle;
    description?: string;
    billingType?: AsaasBillingType;
  },
) {
  if (isDemoMode()) return Promise.resolve({ id } as AsaasSubscription);
  return request<AsaasSubscription>("PUT", `/subscriptions/${id}`, {
    ...(input.valueCents !== undefined ? { value: reais(input.valueCents) } : {}),
    ...(input.cycle ? { cycle: input.cycle } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.billingType ? { billingType: input.billingType } : {}),
    updatePendingPayments: true,
  });
}

/** New card for an existing subscription, without charging now (next charges use it). */
export function updateSubscriptionCard(
  id: string,
  input: { creditCardToken: string; remoteIp: string },
) {
  if (isDemoMode()) return Promise.resolve({ id } as AsaasSubscription);
  return request<AsaasSubscription>("PUT", `/subscriptions/${id}/creditCard`, input);
}

export function deleteSubscription(id: string) {
  if (isDemoMode()) return Promise.resolve({ deleted: true, id });
  return request<{ deleted: boolean; id: string }>("DELETE", `/subscriptions/${id}`);
}

export async function listSubscriptionPayments(id: string): Promise<AsaasPayment[]> {
  if (isDemoMode()) return demoPayments().get(id) ?? [];
  const result = await request<{ data: AsaasPayment[] }>("GET", `/subscriptions/${id}/payments`);
  return result.data ?? [];
}

/** QR code and "copia e cola" of a Pix charge. */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  if (isDemoMode()) {
    const payload = `00020126580014br.gov.bcb.pix0136demo-${paymentId}5204000053039865802BR5913LIVELY DEMO6009SAO PAULO6304ABCD`;
    const dataUrl = await QRCode.toDataURL(payload, { width: 320, margin: 1 });
    return {
      encodedImage: dataUrl.replace(/^data:image\/png;base64,/, ""),
      payload,
      expirationDate: new Date(Date.now() + 86_400_000).toISOString(),
    };
  }
  return request<AsaasPixQrCode>("GET", `/payments/${paymentId}/pixQrCode`);
}

/** Demo only: marks the latest pending charge of a subscription as paid. */
export function confirmDemoPayment(subscriptionId: string): AsaasPayment | null {
  const payment = (demoPayments().get(subscriptionId) ?? []).find(
    (p: AsaasPayment) => p.status === "PENDING",
  );
  if (!payment) return null;
  payment.status = "CONFIRMED";
  payment.paymentDate = new Date().toISOString().slice(0, 10);
  return payment;
}

/** Demo only: a new pending charge (renewal / change of payment method). */
export function createDemoPendingPayment(
  subscriptionId: string,
  cents: number,
  billingType: AsaasBillingType,
): AsaasPayment {
  return demoPayment(subscriptionId, cents, billingType);
}
