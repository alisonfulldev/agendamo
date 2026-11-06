import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { PGlite } from "@electric-sql/pglite";

import { DEMO_PASSWORD } from "./mode";
import { writeDemoObject } from "./storage";

/**
 * "Site ou Loja" demo accounts (2026-11-07): a store and a site, subscribed to the "web" plan,
 * with photos, texts and catalog. Added once, also to demo databases created before them.
 */
export const WEB_DEMO_PERSONAS = [
  {
    email: "loja@demo.com",
    label: "Bela Cosméticos (Loja · Site ou Loja)",
    description: "Loja com catálogo e sacolinha que manda o pedido pelo WhatsApp.",
    brandKey: "general",
    slug: "bela-cosmeticos",
  },
  {
    email: "site@demo.com",
    label: "Silva & Costa Advocacia (Site · Site ou Loja)",
    description: "Site de serviços: todo botão leva ao WhatsApp.",
    brandKey: "general",
    slug: "silva-costa-advocacia",
  },
];

interface WebSeed {
  email: string;
  name: string;
  slug: string;
  product: "site" | "store";
  template: string;
  bio: string;
  city: string;
  whatsapp: string;
  /** Example photos (public/examples/gallery/<name>.webp). */
  photos: string[];
  hero: string;
  items: {
    name: string;
    description: string;
    price: number | null;
    category?: string;
    photo?: string;
  }[];
}

const SEEDS: WebSeed[] = [
  {
    email: "loja@demo.com",
    name: "Bela Cosméticos",
    slug: "bela-cosmeticos",
    product: "store",
    template: "store_showcase",
    bio: "Esmaltes, cuidados com as mãos e maquiagem selecionados a dedo. Entregamos em toda a cidade ou você retira na loja, no centro.",
    city: "Florianópolis",
    whatsapp: "5548999990010",
    photos: ["beauty-1", "beauty-2", "nails-3"],
    hero: "nails-1",
    items: [
      {
        name: "Kit 6 esmaltes nude",
        description: "Tons que combinam com tudo, secagem rápida.",
        price: 8990,
        category: "Esmaltes",
        photo: "nails-2",
      },
      {
        name: "Esmalte vermelho clássico",
        description: "O vermelho que nunca sai de moda.",
        price: 1490,
        category: "Esmaltes",
        photo: "nails-4",
      },
      {
        name: "Óleo de cutícula",
        description: "Hidrata e fortalece, com vitamina E.",
        price: 2490,
        category: "Cuidados",
        photo: "nails-5",
      },
      {
        name: "Creme para mãos",
        description: "Toque seco e perfume suave.",
        price: 3290,
        category: "Cuidados",
        photo: "nails-6",
      },
      {
        name: "Paleta de sombras",
        description: "12 cores, do básico ao noite.",
        price: 6990,
        category: "Maquiagem",
        photo: "beauty-3",
      },
      {
        name: "Kit pincéis",
        description: "8 pincéis macios com estojo.",
        price: 5990,
        category: "Maquiagem",
        photo: "beauty-4",
      },
    ],
  },
  {
    email: "site@demo.com",
    name: "Silva & Costa Advocacia",
    slug: "silva-costa-advocacia",
    product: "site",
    template: "site_bold",
    bio: "Escritório com mais de 15 anos defendendo trabalhadores, famílias e pequenas empresas. Atendimento humano, linguagem simples e acompanhamento de perto em cada etapa do seu processo.",
    city: "Curitiba",
    whatsapp: "5541999990011",
    photos: ["consulting-2", "consulting-3", "consulting-4"],
    hero: "consulting-1",
    items: [
      {
        name: "Direito trabalhista",
        description: "Rescisão, horas extras, assédio e acidentes de trabalho.",
        price: null,
      },
      {
        name: "Direito de família",
        description: "Divórcio, pensão, guarda e inventário com cuidado e discrição.",
        price: null,
      },
      {
        name: "Empresas",
        description: "Contratos, cobranças e consultoria preventiva para pequenos negócios.",
        price: null,
      },
      {
        name: "Consulta inicial",
        description: "Uma conversa para entender o seu caso e o melhor caminho.",
        price: 15000,
      },
    ],
  },
];

function examplePhoto(name: string): Buffer {
  return readFileSync(path.join(process.cwd(), "public", "examples", "gallery", `${name}.webp`));
}

async function one<T>(db: PGlite, sql: string, params: unknown[] = []): Promise<T> {
  return (await db.query<T>(sql, params)).rows[0]!;
}

export async function seedWebDemo(db: PGlite): Promise<void> {
  for (const seed of SEEDS) {
    const exists = await db.query("select 1 from public.businesses where slug = $1", [seed.slug]);
    if (exists.rows.length) continue;

    const user =
      (await db.query<{ id: string }>("select id from auth.users where email = $1", [seed.email]))
        .rows[0] ??
      (await one<{ id: string }>(
        db,
        `insert into auth.users (id, email, encrypted_password, email_confirmed_at)
         values (gen_random_uuid(), $1, $2, now()) returning id`,
        [seed.email, DEMO_PASSWORD],
      ));

    const { id: businessId } = await one<{ id: string }>(
      db,
      "select public.create_business($1, $2) as id",
      [
        user.id,
        JSON.stringify({
          name: seed.name,
          slug: seed.slug,
          brand_key: "general",
          segment: "general",
          page: { whatsapp_number: seed.whatsapp, city: seed.city },
          // create_business asks for a booking service and hours: removed right after.
          services: [{ name: "Atendimento", duration_minutes: 30, price_cents: 0 }],
          hours: [{ weekday: 1, start_time: "09:00", end_time: "18:00" }],
        }),
      ],
    );
    await db.query("delete from public.services where business_id = $1", [businessId]);
    await db.query(
      `update public.businesses set plan = 'complete', plan_tier = 'web', product = $2,
         trial_started_at = null, trial_ends_at = null where id = $1`,
      [businessId, seed.product],
    );
    await db.query(
      `insert into public.subscriptions (business_id, provider_customer_id, provider_subscription_id, plan, tier, billing_cycle, extra_professionals, status, current_period_end)
       values ($1, 'demo_cus_' || $2::text, 'demo_sub_' || $2::text, 'complete', 'web', 'monthly', 0, 'active', now() + interval '20 days')`,
      [businessId, seed.slug],
    );

    const key = (kind: string, name: string) => `businesses/${businessId}/${kind}/${name}.webp`;
    writeDemoObject(key("site_hero", seed.hero), examplePhoto(seed.hero));
    await db.query(`update public.page_settings set bio = $2 where business_id = $1`, [
      businessId,
      seed.bio,
    ]);
    await db.query(
      `insert into public.site_settings (business_id, template, hero_image_key) values ($1, $2, $3)
       on conflict (business_id) do update set template = excluded.template, hero_image_key = excluded.hero_image_key`,
      [businessId, seed.template, key("site_hero", seed.hero)],
    );
    for (const [position, photo] of seed.photos.entries()) {
      writeDemoObject(key("photo", photo), examplePhoto(photo));
      await db.query(
        `insert into public.page_photos (business_id, object_key, width, height, size_bytes, position)
         values ($1, $2, 800, 800, 50000, $3)`,
        [businessId, key("photo", photo), position],
      );
    }
    for (const [position, item] of seed.items.entries()) {
      const imageKey = item.photo ? key("catalog", item.photo) : null;
      if (item.photo) writeDemoObject(imageKey!, examplePhoto(item.photo));
      await db.query(
        `insert into public.catalog_items (business_id, kind, name, description, price_cents, category, image_key, position)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          businessId,
          seed.product === "store" ? "product" : "service",
          item.name,
          item.description,
          item.price,
          item.category ?? null,
          imageKey,
          position,
        ],
      );
    }
  }
}
