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
  customer?: string;
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

/**
 * Pix Automático authorization (journey 3: the first payment's QR also authorizes the next ones).
 * With paymentCreationMode SUBSCRIPTION, Asaas creates a subscription once it is ACTIVE.
 */
export interface AsaasPixAutomaticAuthorization {
  id: string;
  status: "CREATED" | "ACTIVE" | "CANCELLED" | "REFUSED" | "EXPIRED";
  customerId?: string;
  value?: number | null;
  subscriptionId?: string | null;
  payload?: string | null;
  encodedImage?: string | null;
  immediateQrCode?: {
    payload?: string | null;
    encodedImage?: string | null;
    expirationDate?: string | null;
  } | null;
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
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!response.ok) {
    // Never include the request body here: it carries the payer's CPF/CNPJ.
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

function demoPayment(subscriptionId: string, cents: number): AsaasPayment {
  const payment: AsaasPayment = {
    id: `pay_demo_${randomUUID().slice(0, 8)}`,
    subscription: subscriptionId,
    status: "PENDING",
    value: reais(cents),
    dueDate: new Date().toISOString().slice(0, 10),
    invoiceUrl: "",
    billingType: "PIX",
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

/** Regular Pix subscription: each charge is paid with its own QR (fallback and add-ons). */
export async function createSubscription(input: {
  customer: string;
  valueCents: number;
  cycle: AsaasCycle;
  nextDueDate: string;
  description: string;
  externalReference: string;
}): Promise<AsaasSubscription> {
  if (isDemoMode()) {
    const id = `sub_demo_${randomUUID().slice(0, 8)}`;
    demoPayment(id, input.valueCents);
    return {
      id,
      customer: input.customer,
      status: "ACTIVE",
      value: reais(input.valueCents),
      nextDueDate: input.nextDueDate,
      cycle: input.cycle,
      billingType: "PIX",
    };
  }
  return request<AsaasSubscription>("POST", "/subscriptions", {
    customer: input.customer,
    billingType: "PIX",
    value: reais(input.valueCents),
    nextDueDate: input.nextDueDate,
    cycle: input.cycle,
    description: input.description,
    externalReference: input.externalReference,
  });
}

export function updateSubscription(
  id: string,
  input: { valueCents?: number; cycle?: AsaasCycle; description?: string },
) {
  if (isDemoMode()) return Promise.resolve({ id } as AsaasSubscription);
  return request<AsaasSubscription>("PUT", `/subscriptions/${id}`, {
    ...(input.valueCents !== undefined ? { value: reais(input.valueCents) } : {}),
    ...(input.cycle ? { cycle: input.cycle } : {}),
    ...(input.description ? { description: input.description } : {}),
    updatePendingPayments: true,
  });
}

// ---------------------------------------------------------------------------
// Pix Automático (docs.asaas.com/docs/pix-automatico-implementacao)

const DEMO_PIX_PAYLOAD = (id: string) =>
  `00020126580014br.gov.bcb.pix0136demo-${id}5204000053039865802BR5913LIVELY DEMO6009SAO PAULO6304ABCD`;

/**
 * Creates the authorization and the QR of its first payment (value of the first charge). Once the
 * payer pays and the bank confirms, it turns ACTIVE and Asaas generates the next charges (from
 * startDate) through its own subscription, debited automatically.
 */
export async function createPixAutomaticAuthorization(input: {
  customerId: string;
  /** Recurring value (fixed: a new value needs a new authorization). */
  valueCents: number;
  /** Value of the first payment, paid with the QR. */
  firstValueCents: number;
  cycle: AsaasCycle;
  /** First automatic debit (yyyy-MM-dd). */
  startDate: string;
  description: string;
}): Promise<AsaasPixAutomaticAuthorization> {
  // Asaas limits contractId and description to 35 characters.
  const contractId = randomUUID().replace(/-/g, "");
  const description = input.description.slice(0, 35);
  if (isDemoMode()) {
    const id = `aut_demo_${randomUUID().slice(0, 8)}`;
    const subscriptionId = `sub_demo_${randomUUID().slice(0, 8)}`;
    demoPayment(subscriptionId, input.firstValueCents);
    const dataUrl = await QRCode.toDataURL(DEMO_PIX_PAYLOAD(id), { width: 320, margin: 1 });
    return {
      id,
      status: "CREATED",
      customerId: input.customerId,
      value: reais(input.valueCents),
      // The simulation links the subscription at once so /demo can confirm the payment.
      subscriptionId,
      payload: DEMO_PIX_PAYLOAD(id),
      encodedImage: dataUrl.replace(/^data:image\/png;base64,/, ""),
      immediateQrCode: { expirationDate: new Date(Date.now() + 86_400_000).toISOString() },
    };
  }
  return request<AsaasPixAutomaticAuthorization>("POST", "/pix/automatic/authorizations", {
    customerId: input.customerId,
    frequency: input.cycle === "YEARLY" ? "ANNUALLY" : "MONTHLY",
    contractId,
    startDate: input.startDate,
    value: reais(input.valueCents),
    description,
    paymentCreationMode: "SUBSCRIPTION",
    // The payer's bank may try again on the following days when the debit fails.
    retryPolicy: "ALLOW_THREE_IN_SEVEN_DAYS",
    immediateQrCode: {
      expirationSeconds: 86_400,
      originalValue: reais(input.firstValueCents),
      description,
    },
  });
}

export function getPixAutomaticAuthorization(id: string) {
  if (isDemoMode())
    return Promise.resolve({ id, status: "ACTIVE" } as AsaasPixAutomaticAuthorization);
  return request<AsaasPixAutomaticAuthorization>("GET", `/pix/automatic/authorizations/${id}`);
}

export function cancelPixAutomaticAuthorization(id: string) {
  if (isDemoMode()) return Promise.resolve({ id, status: "CANCELLED" });
  return request<AsaasPixAutomaticAuthorization>("DELETE", `/pix/automatic/authorizations/${id}`);
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
    const payload = DEMO_PIX_PAYLOAD(paymentId);
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

/** Demo only: a new pending charge (renewal). */
export function createDemoPendingPayment(subscriptionId: string, cents: number): AsaasPayment {
  return demoPayment(subscriptionId, cents);
}
