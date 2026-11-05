import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory tables behind the admin client: enough of the query builder for the webhook.
type Row = Record<string, unknown>;
const db: Record<string, Row[]> = { subscriptions: [], businesses: [] };

function query(table: string) {
  const filters: ((row: Row) => boolean)[] = [];
  let patch: Row | null = null;
  const run = () => {
    const rows = (db[table] ?? []).filter((row) => filters.every((f) => f(row)));
    if (patch) for (const row of rows) Object.assign(row, patch);
    return rows;
  };
  const api = {
    select: () => api,
    update: (values: Row) => {
      patch = values;
      return api;
    },
    eq: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return api;
    },
    contains: () => {
      filters.push(() => false);
      return api;
    },
    maybeSingle: async () => {
      const rows = run();
      return { data: patch ? null : (structuredClone(rows[0]) ?? null), error: null };
    },
    then: (resolve: (value: { data: null; error: null }) => void) => {
      run();
      resolve({ data: null, error: null });
    },
  };
  return api;
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: query, rpc: async () => ({ data: null, error: null }) }),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => undefined) }));
vi.mock("@/lib/cache", () => ({ invalidatePublicPage: vi.fn() }));
vi.mock("@/lib/trial", () => ({ recordTrialClaims: vi.fn(async () => undefined) }));
const notifyTeam = vi.fn(async () => undefined);
vi.mock("@/lib/notifications/owner", () => ({
  claimNotification: vi.fn(async () => true),
  notifyTeam,
}));
const asaas = {
  createSubscription: vi.fn(async () => ({ id: "sub_regular_new" })),
  deleteSubscription: vi.fn(async () => ({ deleted: true })),
  cancelPixAutomaticAuthorization: vi.fn(async () => ({})),
  getPixAutomaticAuthorization: vi.fn(async () => ({ id: "aut_1", status: "ACTIVE" })),
};
vi.mock("./asaas", () => ({
  ...asaas,
  createCustomer: vi.fn(),
  createPixAutomaticAuthorization: vi.fn(),
  getPixQrCode: vi.fn(),
  listSubscriptionPayments: vi.fn(async () => []),
  updateSubscription: vi.fn(),
}));

const { handleAsaasEvent, periodBase, syncPixAutomatic } = await import("./service");

const NOW = new Date("2026-10-28T15:00:00Z");

function subscription(values: Row): Row {
  return {
    id: "row_1",
    business_id: "biz_1",
    provider_customer_id: "cus_1",
    provider_subscription_id: null,
    billing_cycle: "monthly",
    extra_professionals: 0,
    value_cents: 2390,
    status: "pending",
    current_period_end: null,
    pix_automatic_id: "aut_1",
    pix_automatic_status: "created",
    pix_automatic_first_payment_id: null,
    addons: {},
    ...values,
  };
}

const row = () => db.subscriptions[0]!;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  db.businesses = [{ id: "biz_1", plan: "free", slug: "studio", trial_ends_at: null }];
  db.subscriptions = [];
});

describe("periodBase", () => {
  it("starts a new subscription today and a renewal at the end of the paid period", () => {
    expect(periodBase({ status: "pending", current_period_end: null }, "2026-10-28")).toBe(
      "2026-10-28",
    );
    expect(
      periodBase({ status: "overdue", current_period_end: "2026-10-20T12:00:00Z" }, "2026-10-28"),
    ).toBe("2026-10-20");
  });
});

describe("Pix Automático webhook", () => {
  it("first payment activates the plan once; the bank confirmation links the subscription", async () => {
    db.subscriptions = [subscription({})];
    const payment = {
      id: "pay_first",
      customer: "cus_1",
      status: "RECEIVED",
      value: 23.9,
      dueDate: "2026-10-28",
      invoiceUrl: "",
      billingType: "PIX",
    };
    await handleAsaasEvent({ id: "e1", event: "PAYMENT_RECEIVED", payment });
    expect(row()).toMatchObject({
      status: "active",
      pix_automatic_first_payment_id: "pay_first",
      current_period_end: "2026-11-28T12:00:00.000Z",
    });
    expect(db.businesses[0]!.plan).toBe("complete");

    // The same payment confirmed again does not move the period.
    await handleAsaasEvent({ id: "e2", event: "PAYMENT_CONFIRMED", payment });
    expect(row().current_period_end).toBe("2026-11-28T12:00:00.000Z");

    await handleAsaasEvent({
      id: "e3",
      event: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED",
      authorization: { id: "aut_1", status: "ACTIVE", subscriptionId: "sub_auto" },
    });
    expect(row()).toMatchObject({
      pix_automatic_status: "active",
      provider_subscription_id: "sub_auto",
      current_period_end: "2026-11-28T12:00:00.000Z",
    });
  });

  it("renewal paid by the authorizing QR replaces the regular subscription", async () => {
    db.subscriptions = [
      subscription({
        status: "overdue",
        provider_subscription_id: "sub_regular",
        current_period_end: "2026-10-25T12:00:00.000Z",
      }),
    ];
    // Confirmation from the bank arrives before (or without) the payment event.
    await handleAsaasEvent({
      id: "e1",
      event: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED",
      authorization: { id: "aut_1", status: "ACTIVE", subscriptionId: "sub_auto" },
    });
    expect(asaas.deleteSubscription).toHaveBeenCalledWith("sub_regular");
    expect(row()).toMatchObject({
      status: "active",
      provider_subscription_id: "sub_auto",
      pix_automatic_status: "active",
      current_period_end: "2026-11-25T12:00:00.000Z",
    });
  });

  it("authorization cancelled at the bank: the plan goes on with the regular Pix", async () => {
    db.subscriptions = [
      subscription({
        status: "active",
        provider_subscription_id: "sub_auto",
        pix_automatic_status: "active",
        pix_automatic_first_payment_id: "pay_first",
        current_period_end: "2026-11-28T12:00:00.000Z",
      }),
    ];
    await handleAsaasEvent({
      id: "e1",
      event: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED",
      authorization: { id: "aut_1", status: "CANCELLED" },
    });
    expect(asaas.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_1", valueCents: 2390, nextDueDate: "2026-11-28" }),
    );
    expect(asaas.deleteSubscription).toHaveBeenCalledWith("sub_auto");
    expect(row()).toMatchObject({
      status: "active",
      provider_subscription_id: "sub_regular_new",
      pix_automatic_status: "cancelled",
    });
    expect(notifyTeam).toHaveBeenCalledOnce();

    // The deletion of the old subscription no longer touches the plan.
    const result = await handleAsaasEvent({
      id: "e2",
      event: "SUBSCRIPTION_DELETED",
      subscription: { id: "sub_auto" },
    });
    expect(result).toBe("ignored: unknown subscription");
    expect(row().status).toBe("active");
  });

  it("subscription ended by the bank before the authorization event: same fallback", async () => {
    db.subscriptions = [
      subscription({
        status: "active",
        provider_subscription_id: "sub_auto",
        pix_automatic_status: "active",
        pix_automatic_first_payment_id: "pay_first",
        current_period_end: "2026-11-28T12:00:00.000Z",
      }),
    ];
    await handleAsaasEvent({
      id: "e1",
      event: "SUBSCRIPTION_INACTIVATED",
      subscription: { id: "sub_auto" },
    });
    expect(row()).toMatchObject({
      status: "active",
      provider_subscription_id: "sub_regular_new",
    });
  });

  it("without the webhook, reading the authorization at Asaas activates the plan", async () => {
    // The first payment arrives as a loose Pix (another customer), so only the bank's
    // confirmation can activate it.
    db.subscriptions = [subscription({})];
    asaas.getPixAutomaticAuthorization.mockResolvedValueOnce({
      id: "aut_1",
      status: "ACTIVE",
      subscriptionId: "sub_auto",
    } as never);
    await syncPixAutomatic("biz_1");
    expect(row()).toMatchObject({
      status: "active",
      pix_automatic_status: "active",
      provider_subscription_id: "sub_auto",
      current_period_end: "2026-11-28T12:00:00.000Z",
    });
    expect(db.businesses[0]!.plan).toBe("complete");
  });

  it("QR never paid: refusal only marks the authorization", async () => {
    db.subscriptions = [subscription({})];
    await handleAsaasEvent({
      id: "e1",
      event: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED",
      authorization: { id: "aut_1", status: "REFUSED" },
    });
    expect(asaas.createSubscription).not.toHaveBeenCalled();
    expect(row()).toMatchObject({ status: "pending", pix_automatic_status: "refused" });
  });

  it("owner cancelled: the authorization events do not bring the plan back", async () => {
    db.subscriptions = [
      subscription({
        status: "cancelled",
        provider_subscription_id: "sub_auto",
        pix_automatic_status: "cancelled",
        current_period_end: "2026-11-28T12:00:00.000Z",
      }),
    ];
    await handleAsaasEvent({
      id: "e1",
      event: "SUBSCRIPTION_DELETED",
      subscription: { id: "sub_auto" },
    });
    expect(asaas.createSubscription).not.toHaveBeenCalled();
    expect(row().status).toBe("cancelled");
  });
});

describe("Site + Agenda: moving down to Completo", () => {
  it("keeps the site until the next payment, then turns it off", async () => {
    db.businesses = [
      { id: "biz_1", plan: "complete", plan_tier: "site", slug: "studio", trial_ends_at: null },
    ];
    db.subscriptions = [
      subscription({
        status: "active",
        provider_subscription_id: "sub_auto",
        pix_automatic_status: "active",
        pix_automatic_first_payment_id: "pay_first",
        tier: "site",
        next_tier: "complete",
        current_period_end: "2026-11-28T12:00:00.000Z",
      }),
    ];
    // Until the renewal the site stays (nothing changed on the business).
    expect(db.businesses[0]!.plan_tier).toBe("site");
    await handleAsaasEvent({
      id: "e1",
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_renewal",
        subscription: "sub_auto",
        status: "RECEIVED",
        value: 23.9,
        dueDate: "2026-11-28",
        invoiceUrl: "",
        billingType: "PIX",
      },
    });
    expect(db.businesses[0]!.plan_tier).toBe("complete");
    expect(row()).toMatchObject({ tier: "complete", next_tier: null });
  });
});
