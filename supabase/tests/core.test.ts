import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { as, createTestDb, createUser, SEED } from "./harness";

const OWNER_BEAUTY = "a0000000-0000-4000-8000-000000000001";
const OWNER_BARBER = "a0000000-0000-4000-8000-000000000002";
const STAFF_ANA = "a0000000-0000-4000-8000-000000000003";

const [ANA, BRUNA] = SEED.psychology.professionals;
const CUSTOMER_ANA = "f0000000-0000-4000-8000-000000000001";
const CUSTOMER_BRUNA = "f0000000-0000-4000-8000-000000000002";
const CUSTOMER_BARBER = "f0000000-0000-4000-8000-000000000003";

let db: PGlite;

async function insertAppointment(
  conn: Pick<PGlite, "query">,
  values: {
    business: string;
    professional: string;
    customer: string;
    start: string;
    end: string;
    status?: string;
  },
) {
  const { rows } = await conn.query<{ id: string }>(
    `insert into public.appointments (business_id, professional_id, customer_id, starts_at, ends_at, status, source)
     values ($1, $2, $3, $4, $5, $6, 'manual') returning id`,
    [
      values.business,
      values.professional,
      values.customer,
      values.start,
      values.end,
      values.status ?? "confirmed",
    ],
  );
  return rows[0]!.id;
}

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await createUser(db, OWNER_BEAUTY);
  await createUser(db, OWNER_BARBER);
  await createUser(db, STAFF_ANA);
  await db.query(
    `insert into public.members (business_id, user_id, role, professional_id) values
       ($1, $2, 'owner', null), ($3, $4, 'owner', null), ($1, $5, 'staff', $6)`,
    [SEED.psychology.business, OWNER_BEAUTY, SEED.physio.business, OWNER_BARBER, STAFF_ANA, ANA],
  );
  await db.query(
    `insert into public.customers (id, business_id, name, phone) values
       ($1, $4, 'Cliente da Ana', '5511900000001'),
       ($2, $4, 'Cliente da Bruna', '5511900000002'),
       ($3, $5, 'Cliente da barbearia', '5511900000003')`,
    [CUSTOMER_ANA, CUSTOMER_BRUNA, CUSTOMER_BARBER, SEED.psychology.business, SEED.physio.business],
  );
  await insertAppointment(db, {
    business: SEED.psychology.business,
    professional: ANA,
    customer: CUSTOMER_ANA,
    start: "2030-01-08T12:00:00Z",
    end: "2030-01-08T13:00:00Z",
  });
  await insertAppointment(db, {
    business: SEED.psychology.business,
    professional: BRUNA,
    customer: CUSTOMER_BRUNA,
    start: "2030-01-08T12:00:00Z",
    end: "2030-01-08T13:00:00Z",
  });
  await insertAppointment(db, {
    business: SEED.physio.business,
    professional: SEED.physio.professionals[0],
    customer: CUSTOMER_BARBER,
    start: "2030-01-08T12:00:00Z",
    end: "2030-01-08T13:00:00Z",
  });
}, 60_000);

describe("schema", () => {
  it("has RLS enabled on every public table", async () => {
    const { rows } = await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(rows).toEqual([]);
  });

  it("rejects reserved and malformed slugs", async () => {
    for (const slug of [
      "painel",
      "ab",
      "Com-Maiuscula",
      "com acento",
      "çedilha",
      "-hifen",
      "a--b",
    ]) {
      await expect(
        db.query(
          "insert into public.businesses (name, slug, brand_key, segment) values ('X', $1, 'psychology', 'psychology')",
          [slug],
        ),
      ).rejects.toThrow();
    }
  });

  it("slug_is_available checks format, reserved list and existing slugs", async () => {
    const check = async (slug: string) =>
      (await db.query<{ ok: boolean }>("select public.slug_is_available($1) as ok", [slug]))
        .rows[0]!.ok;
    expect(await check("novo-negocio")).toBe(true);
    expect(await check("studio-bela")).toBe(false);
    expect(await check("entrar")).toBe(false);
    expect(await check("x")).toBe(false);
  });
});

describe("no double booking", () => {
  it("rejects an overlapping appointment for the same professional", async () => {
    await expect(
      insertAppointment(db, {
        business: SEED.psychology.business,
        professional: ANA,
        customer: CUSTOMER_BRUNA,
        start: "2030-01-08T12:30:00Z",
        end: "2030-01-08T13:30:00Z",
      }),
    ).rejects.toThrow(/appointments_no_overlap/);
  });

  it("allows back-to-back appointments and cancelled overlaps", async () => {
    await as(db, { role: "service_role" }, async (tx) => {
      await insertAppointment(tx, {
        business: SEED.psychology.business,
        professional: ANA,
        customer: CUSTOMER_BRUNA,
        start: "2030-01-08T13:00:00Z",
        end: "2030-01-08T14:00:00Z",
      });
      await insertAppointment(tx, {
        business: SEED.psychology.business,
        professional: ANA,
        customer: CUSTOMER_BRUNA,
        start: "2030-01-08T12:15:00Z",
        end: "2030-01-08T12:45:00Z",
        status: "cancelled",
      });
    });
  });

  it("rejects overlapping use of the same resource by different professionals", async () => {
    await expect(
      as(db, { role: "service_role" }, async (tx) => {
        const first = await insertAppointment(tx, {
          business: SEED.psychology.business,
          professional: ANA,
          customer: CUSTOMER_ANA,
          start: "2030-01-09T12:00:00Z",
          end: "2030-01-09T13:00:00Z",
        });
        const second = await insertAppointment(tx, {
          business: SEED.psychology.business,
          professional: BRUNA,
          customer: CUSTOMER_BRUNA,
          start: "2030-01-09T12:30:00Z",
          end: "2030-01-09T13:30:00Z",
        });
        const useResource = (appointment: string, start: string, end: string) =>
          tx.query(
            `insert into public.appointment_resources (business_id, appointment_id, resource_id, starts_at, ends_at)
             values ($1, $2, $3, $4, $5)`,
            [SEED.psychology.business, appointment, SEED.psychology.resource, start, end],
          );
        await useResource(first, "2030-01-09T12:00:00Z", "2030-01-09T13:00:00Z");
        await useResource(second, "2030-01-09T12:30:00Z", "2030-01-09T13:30:00Z");
      }),
    ).rejects.toThrow(/appointment_resources_no_overlap/);
  });

  it("frees the resource when the appointment is cancelled", async () => {
    await as(db, { role: "service_role" }, async (tx) => {
      const first = await insertAppointment(tx, {
        business: SEED.psychology.business,
        professional: ANA,
        customer: CUSTOMER_ANA,
        start: "2030-01-10T12:00:00Z",
        end: "2030-01-10T13:00:00Z",
      });
      const second = await insertAppointment(tx, {
        business: SEED.psychology.business,
        professional: BRUNA,
        customer: CUSTOMER_BRUNA,
        start: "2030-01-10T12:00:00Z",
        end: "2030-01-10T13:00:00Z",
      });
      const useResource = (appointment: string) =>
        tx.query(
          `insert into public.appointment_resources (business_id, appointment_id, resource_id, starts_at, ends_at)
           values ($1, $2, $3, '2030-01-10T12:00:00Z', '2030-01-10T13:00:00Z')`,
          [SEED.psychology.business, appointment, SEED.psychology.resource],
        );
      await useResource(first);
      await tx.query("update public.appointments set status = 'cancelled' where id = $1", [first]);
      await useResource(second);
      const { rows } = await tx.query<{ active: boolean }>(
        "select active from public.appointment_resources where appointment_id = $1",
        [first],
      );
      expect(rows[0]!.active).toBe(false);
    });
  });
});

describe("tenant isolation", () => {
  const ownerBeauty = { role: "authenticated", userId: OWNER_BEAUTY } as const;

  it("owner reads only their own business data", async () => {
    await as(db, ownerBeauty, async (tx) => {
      const businesses = await tx.query<{ id: string }>("select id from public.businesses");
      expect(businesses.rows.map((r) => r.id)).toEqual([SEED.psychology.business]);

      const appointments = await tx.query<{ business_id: string }>(
        "select distinct business_id from public.appointments",
      );
      expect(appointments.rows.map((r) => r.business_id)).toEqual([SEED.psychology.business]);

      const customers = await tx.query("select id from public.customers where business_id = $1", [
        SEED.physio.business,
      ]);
      expect(customers.rows).toEqual([]);
    });
  });

  it("owner cannot change another business", async () => {
    await as(db, ownerBeauty, async (tx) => {
      const updated = await tx.query(
        "update public.services set price_cents = 1 where business_id = $1",
        [SEED.physio.business],
      );
      expect(updated.affectedRows).toBe(0);
      const renamed = await tx.query("update public.businesses set name = 'Hacked' where id = $1", [
        SEED.physio.business,
      ]);
      expect(renamed.affectedRows).toBe(0);
    });
  });

  it("owner cannot insert into another business", async () => {
    await expect(
      as(db, ownerBeauty, (tx) =>
        tx.query(
          "insert into public.services (business_id, name, duration_minutes) values ($1, 'X', 30)",
          [SEED.physio.business],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot link own professional to another business's service", async () => {
    await expect(
      as(db, ownerBeauty, (tx) =>
        tx.query(
          "insert into public.professional_services (business_id, professional_id, service_id) values ($1, $2, $3)",
          [SEED.psychology.business, ANA, SEED.physio.services[0]],
        ),
      ),
    ).rejects.toThrow();
  });

  it("anon reads nothing directly but can use the public functions", async () => {
    await as(db, { role: "anon" }, async (tx) => {
      expect((await tx.query("select id from public.businesses")).rows).toEqual([]);
      expect((await tx.query("select id from public.customers")).rows).toEqual([]);
      const business = await tx.query<{ name: string }>(
        "select name from public.get_public_business('studio-bela')",
      );
      expect(business.rows[0]!.name).toBe("Studio Bela");
      const services = await tx.query("select * from public.get_public_services($1)", [
        SEED.psychology.business,
      ]);
      expect(services.rows).toHaveLength(3);
    });
  });
});

describe("staff isolation", () => {
  const staffAna = { role: "authenticated", userId: STAFF_ANA } as const;

  it("staff sees only their own professional's appointments", async () => {
    await as(db, staffAna, async (tx) => {
      const { rows } = await tx.query<{ professional_id: string }>(
        "select distinct professional_id from public.appointments",
      );
      expect(rows.map((r) => r.professional_id)).toEqual([ANA]);
    });
  });

  it("staff sees only customers of their own professional", async () => {
    await as(db, staffAna, async (tx) => {
      const { rows } = await tx.query<{ id: string }>("select id from public.customers");
      expect(rows.map((r) => r.id)).toEqual([CUSTOMER_ANA]);
    });
  });

  it("staff cannot create or move appointments to another professional", async () => {
    await expect(
      as(db, staffAna, (tx) =>
        insertAppointment(tx, {
          business: SEED.psychology.business,
          professional: BRUNA,
          customer: CUSTOMER_ANA,
          start: "2030-02-01T12:00:00Z",
          end: "2030-02-01T13:00:00Z",
        }),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("staff cannot edit services or the business", async () => {
    await as(db, staffAna, async (tx) => {
      const updated = await tx.query(
        "update public.services set price_cents = 1 where business_id = $1",
        [SEED.psychology.business],
      );
      expect(updated.affectedRows).toBe(0);
    });
  });
});
