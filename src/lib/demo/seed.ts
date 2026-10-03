import "server-only";

import type { PGlite } from "@electric-sql/pglite";

import { getBrand } from "@/brands";

import { DEMO_PASSWORD } from "./mode";
import { writeDemoObject } from "./storage";

/**
 * Demo data: one business per brand (different plans), ready accounts, customers, past and
 * future appointments, requests, reviews, sales tools and 60 days of page statistics.
 */
export interface DemoPersona {
  email: string;
  label: string;
  description: string;
  brandKey: string | null;
  slug: string | null;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    email: "dona.beleza@demo.com",
    label: "Studio Bela (Beleza · assinante)",
    description: "Agenda cheia, financeiro, sinal por Pix, cupons, pacotes e estatísticas.",
    brandKey: "beauty",
    slug: "studio-bela",
  },
  {
    email: "dono.barbearia@demo.com",
    label: "Barbearia Navalha (Barbearia · teste encerrado)",
    description: "Sem assinatura: o chat termina no WhatsApp e o painel abre só para assinar.",
    brandKey: "barber",
    slug: "barbearia-navalha",
  },
  {
    email: "dona.estetica@demo.com",
    label: "Clínica Pele (Estética · assinante, 3 profissionais)",
    description: "3 profissionais, maca compartilhada, “qualquer profissional”.",
    brandKey: "aesthetics",
    slug: "clinica-pele",
  },
  {
    email: "equipe.estetica@demo.com",
    label: "Profissional da Clínica Pele (equipe)",
    description: "Acesso de equipe: vê só a própria agenda.",
    brandKey: "aesthetics",
    slug: "clinica-pele",
  },
  {
    email: "psi@demo.com",
    label: "Espaço Escuta (Psicologia · em teste)",
    description: "Teste grátis de 30 dias em andamento (faltam 18 dias).",
    brandKey: "psychology",
    slug: "espaco-escuta",
  },
  {
    email: "fisio@demo.com",
    label: "Movimento Fisio (Fisioterapia · assinante anual)",
    description: "Pacotes de sessões e lembretes.",
    brandKey: "physio",
    slug: "movimento-fisio",
  },
  {
    email: "nova@demo.com",
    label: "Conta nova (sem negócio)",
    description: "Para testar o cadastro do negócio do zero.",
    brandKey: null,
    slug: null,
  },
  {
    email: "admin@demo.com",
    label: "Administrador da plataforma",
    description: "Acesso a /admin.",
    brandKey: null,
    slug: null,
  },
];

interface ServiceSeed {
  name: string;
  minutes: number;
  price: number;
}

interface BusinessSeed {
  owner: string;
  name: string;
  slug: string;
  brand: string;
  plan: "free" | "pro";
  /** Days left in the trial (negative = ended). Omitted: the trial started at creation. */
  trialDaysLeft?: number;
  /** Paid professionals (subscribed businesses). */
  seats?: number;
  yearly?: boolean;
  bio: string;
  city: string;
  neighborhood: string;
  address: string;
  whatsapp: string;
  instagram?: string;
  services: ServiceSeed[];
  extraProfessionals?: string[];
  resource?: string;
  pix?: boolean;
  rich?: boolean;
}

const BUSINESSES: BusinessSeed[] = [
  {
    owner: "dona.beleza@demo.com",
    name: "Studio Bela",
    slug: "studio-bela",
    brand: "beauty",
    plan: "pro",
    bio: "Unhas, cabelo e sobrancelhas com carinho e hora marcada. Atendimento sem atraso em Moema.",
    city: "São Paulo",
    neighborhood: "Moema",
    address: "Av. Ibirapuera, 2000",
    whatsapp: "5511999990001",
    instagram: "https://instagram.com/studiobela",
    services: [
      { name: "Manicure", minutes: 45, price: 4000 },
      { name: "Pedicure", minutes: 45, price: 4500 },
      { name: "Escova", minutes: 45, price: 6000 },
      { name: "Design de sobrancelha", minutes: 30, price: 5000 },
    ],
    pix: true,
    rich: true,
  },
  {
    owner: "dono.barbearia@demo.com",
    name: "Barbearia Navalha",
    slug: "barbearia-navalha",
    brand: "barber",
    plan: "free",
    trialDaysLeft: -5,
    bio: "Corte clássico, degradê e barba na toalha quente. Cerveja gelada enquanto espera.",
    city: "São Paulo",
    neighborhood: "Pinheiros",
    address: "Rua dos Pinheiros, 500",
    whatsapp: "5511999990002",
    services: [
      { name: "Corte", minutes: 30, price: 4500 },
      { name: "Barba", minutes: 30, price: 3500 },
      { name: "Corte + barba", minutes: 60, price: 7000 },
    ],
    rich: true,
  },
  {
    owner: "dona.estetica@demo.com",
    name: "Clínica Pele",
    slug: "clinica-pele",
    brand: "aesthetics",
    plan: "pro",
    seats: 3,
    bio: "Limpeza de pele, drenagem e tratamentos faciais com equipe especializada.",
    city: "Campinas",
    neighborhood: "Cambuí",
    address: "Rua Coronel Quirino, 1200",
    whatsapp: "5519999990003",
    services: [
      { name: "Limpeza de pele", minutes: 60, price: 15000 },
      { name: "Drenagem linfática", minutes: 60, price: 12000 },
      { name: "Peeling", minutes: 45, price: 18000 },
    ],
    extraProfessionals: ["Juliana", "Marina"],
    resource: "Maca 1",
    pix: true,
    rich: true,
  },
  {
    owner: "psi@demo.com",
    name: "Espaço Escuta",
    slug: "espaco-escuta",
    brand: "psychology",
    plan: "free",
    trialDaysLeft: 18,
    bio: "Psicoterapia para adultos, presencial e online, com sessões semanais de 50 minutos.",
    city: "Belo Horizonte",
    neighborhood: "Savassi",
    address: "Rua Pernambuco, 800",
    whatsapp: "5531999990004",
    services: [
      { name: "Sessão individual", minutes: 50, price: 18000 },
      { name: "Sessão online", minutes: 50, price: 16000 },
      { name: "Primeira conversa", minutes: 30, price: 0 },
    ],
    rich: true,
  },
  {
    owner: "fisio@demo.com",
    name: "Movimento Fisio",
    slug: "movimento-fisio",
    brand: "physio",
    plan: "pro",
    yearly: true,
    bio: "Fisioterapia ortopédica, pilates clínico e reabilitação pós-cirúrgica.",
    city: "Curitiba",
    neighborhood: "Batel",
    address: "Av. do Batel, 1500",
    whatsapp: "5541999990005",
    services: [
      { name: "Sessão de fisioterapia", minutes: 50, price: 13000 },
      { name: "Pilates clínico", minutes: 50, price: 11000 },
      { name: "Avaliação", minutes: 60, price: 15000 },
    ],
    rich: true,
  },
  // Two more complete beauty pages so the portal has listings to show.
  {
    owner: "salao.aurora@demo.com",
    name: "Salão Aurora",
    slug: "salao-aurora",
    brand: "beauty",
    plan: "free",
    bio: "Cortes, coloração e manicure num espaço tranquilo pertinho do metrô.",
    city: "São Paulo",
    neighborhood: "Moema",
    address: "Alameda dos Maracatins, 300",
    whatsapp: "5511999990006",
    services: [
      { name: "Manicure", minutes: 45, price: 3800 },
      { name: "Escova", minutes: 45, price: 5500 },
      { name: "Corte feminino", minutes: 60, price: 9000 },
    ],
  },
  {
    owner: "esmalteria.flor@demo.com",
    name: "Esmalteria Flor",
    slug: "esmalteria-flor",
    brand: "beauty",
    plan: "free",
    bio: "Esmalteria com mais de 200 cores, alongamento em gel e spa dos pés.",
    city: "São Paulo",
    neighborhood: "Vila Mariana",
    address: "Rua Domingos de Morais, 900",
    whatsapp: "5511999990007",
    services: [
      { name: "Manicure", minutes: 40, price: 3500 },
      { name: "Pedicure", minutes: 40, price: 4000 },
      { name: "Escova", minutes: 40, price: 5000 },
    ],
  },
];

const CUSTOMERS = [
  ["Mariana Souza", "5511988880001", "1990-10-08", true],
  ["Juliana Lima", "5511988880002", "1985-03-21", true],
  ["Fernanda Alves", "5511988880003", "1995-07-02", false],
  ["Carla Mendes", "5511988880004", "1988-12-15", true],
  ["Patrícia Rocha", "5511988880005", null, false],
  ["Beatriz Costa", "5511988880006", "1999-05-30", true],
  ["Renata Dias", "5511988880007", "1979-09-11", false],
  ["Camila Ferreira", "5511988880008", "1992-01-25", true],
  ["Larissa Gomes", "5511988880009", null, false],
  ["Aline Martins", "5511988880010", "1983-11-04", true],
] as const;

const REVIEW_COMMENTS = [
  "Atendimento impecável, saí muito feliz!",
  "Pontual e caprichosa. Já marquei a próxima.",
  "Ambiente lindo e super limpo.",
  "Gostei bastante, recomendo.",
  null,
];

async function one<T>(db: PGlite, sql: string, params: unknown[] = []): Promise<T> {
  return (await db.query<T>(sql, params)).rows[0]!;
}

async function createUser(db: PGlite, email: string): Promise<string> {
  const row = await one<{ id: string }>(
    db,
    `insert into auth.users (id, email, encrypted_password, email_confirmed_at)
     values (gen_random_uuid(), $1, $2, now()) returning id`,
    [email, DEMO_PASSWORD],
  );
  return row.id;
}

/** Initials on the brand color, so seeded pages count as complete profiles (portal). */
function avatarSvg(name: string, brandKey: string): Buffer {
  const theme = getBrand(brandKey)?.theme;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">` +
      `<rect width="400" height="400" fill="${theme?.primary}"/>` +
      `<text x="200" y="250" font-family="sans-serif" font-size="150" font-weight="700" text-anchor="middle" fill="${theme?.surface}">${initials}</text>` +
      `</svg>`,
  );
}

/** Local time in the business timezone, `days` from today. */
const LOCAL_TS = `((current_date + $1::int) + $2::time) at time zone 'America/Sao_Paulo'`;

async function seedBusiness(db: PGlite, seed: BusinessSeed, userIds: Map<string, string>) {
  const ownerId = userIds.get(seed.owner) ?? (await createUser(db, seed.owner));
  userIds.set(seed.owner, ownerId);
  const hours = [1, 2, 3, 4, 5, 6].flatMap((weekday) => [
    { weekday, start_time: "09:00", end_time: "12:00" },
    { weekday, start_time: "13:00", end_time: weekday === 6 ? "16:00" : "19:00" },
  ]);
  const { id: businessId } = await one<{ id: string }>(
    db,
    "select public.create_business($1, $2) as id",
    [
      ownerId,
      JSON.stringify({
        name: seed.name,
        slug: seed.slug,
        brand_key: seed.brand,
        segment: seed.brand,
        page: {
          whatsapp_number: seed.whatsapp,
          instagram_url: seed.instagram,
          address: seed.address,
          city: seed.city,
          neighborhood: seed.neighborhood,
        },
        services: seed.services.map((s) => ({
          name: s.name,
          duration_minutes: s.minutes,
          price_cents: s.price,
        })),
        hours,
      }),
    ],
  );

  await db.query(
    `update public.businesses set plan = $2, min_notice_minutes = 60, professional_seats = $4::int,
       trial_started_at = case when $3::int is null then trial_started_at else now() - make_interval(days => 30 - $3::int) end,
       trial_ends_at = case when $3::int is null then trial_ends_at else now() + make_interval(days => $3::int) end
     where id = $1`,
    [businessId, seed.plan, seed.trialDaysLeft ?? null, seed.seats ?? 1],
  );
  await db.query(
    `update public.page_settings set bio = $2,
       pix_key = case when $3::boolean then 'contato@' || $4::text || '.com.br' end,
       pix_receiver_name = case when $3::boolean then upper(left($5::text, 25)) end,
       google_review_url = 'https://g.page/r/demo',
       avatar_key = $6::text
     where business_id = $1`,
    [
      businessId,
      seed.bio,
      Boolean(seed.pix),
      seed.slug.replace(/-/g, ""),
      seed.name,
      `businesses/${businessId}/avatar/demo.svg`,
    ],
  );
  writeDemoObject(`businesses/${businessId}/avatar/demo.svg`, avatarSvg(seed.name, seed.brand));
  if (seed.plan !== "free") {
    await db.query(
      `insert into public.subscriptions (business_id, provider_customer_id, provider_subscription_id, plan, billing_cycle, extra_professionals, status, current_period_end)
       values ($1, 'demo_cus_' || $2::text, 'demo_sub_' || $2::text, 'pro', $3, $4::int, 'active',
         now() + case when $3 = 'yearly' then interval '300 days' else interval '20 days' end)`,
      [businessId, seed.slug, seed.yearly ? "yearly" : "monthly", (seed.seats ?? 1) - 1],
    );
  }

  const owner = await one<{ id: string }>(
    db,
    "select id from public.professionals where business_id = $1 order by position limit 1",
    [businessId],
  );
  const professionalIds = [owner.id];
  for (const [index, name] of (seed.extraProfessionals ?? []).entries()) {
    const pro = await one<{ id: string }>(
      db,
      "insert into public.professionals (business_id, name, position) values ($1, $2, $3) returning id",
      [businessId, name, index + 1],
    );
    professionalIds.push(pro.id);
    await db.query(
      `insert into public.professional_services (business_id, professional_id, service_id)
       select $1, $2, id from public.services where business_id = $1`,
      [businessId, pro.id],
    );
    await db.query(
      `insert into public.working_hours (business_id, professional_id, weekday, start_time, end_time)
       select business_id, $1, weekday, start_time, end_time from public.working_hours where professional_id = $2`,
      [pro.id, owner.id],
    );
  }
  const services = (
    await db.query<{ id: string; name: string; duration_minutes: number; price_cents: number }>(
      "select id, name, duration_minutes, price_cents from public.services where business_id = $1 order by position",
      [businessId],
    )
  ).rows;
  if (seed.resource) {
    const resource = await one<{ id: string }>(
      db,
      "insert into public.resources (business_id, name) values ($1, $2) returning id",
      [businessId, seed.resource],
    );
    await db.query(
      "insert into public.service_resources (business_id, service_id, resource_id) values ($1, $2, $3)",
      [businessId, services[0]!.id, resource.id],
    );
  }

  await db.query(
    `insert into public.page_links (business_id, label, url, position) values
       ($1::uuid, 'Instagram', 'https://instagram.com/' || $2::text, 0),
       ($1::uuid, 'Como chegar', 'https://maps.google.com/?q=' || $2::text, 1)`,
    [businessId, seed.slug],
  );

  if (!seed.rich) return { businessId, professionalIds, services };

  // Customers.
  const customerIds: string[] = [];
  for (const [index, [name, phone, birthdate, optIn]] of CUSTOMERS.entries()) {
    const email = `${name
      .split(" ")[0]!
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z]/g, "")}.${seed.slug.split("-")[0]}@exemplo.com`;
    const customer = await one<{ id: string }>(
      db,
      `insert into public.customers (business_id, name, phone, email, birthdate, marketing_opt_in, created_at)
       values ($1, $2, $3, $4, $5::date, $6, now() - make_interval(days => $7::int)) returning id`,
      [
        businessId,
        name,
        phone.replace(/^55119/, `55${seed.whatsapp.slice(2, 4)}9`),
        email,
        birthdate,
        optIn,
        120 - index * 7,
      ],
    );
    customerIds.push(customer.id);
  }

  // Appointments: past (completed / no-show / cancelled) and the next two weeks.
  const plan: { day: number; time: string; status: string; customer: number }[] = [];
  for (let i = 0; i < 18; i++) {
    plan.push({
      day: -3 - i * 4,
      time: ["10:00", "14:00", "16:00"][i % 3]!,
      status: i === 4 ? "no_show" : i === 9 ? "cancelled" : "completed",
      customer: i % customerIds.length,
    });
  }
  for (let i = 0; i < 9; i++) {
    plan.push({
      day: 1 + Math.floor(i / 2),
      time: i % 2 === 0 ? "10:00" : "15:00",
      status: i === 3 && seed.pix ? "awaiting_deposit" : "confirmed",
      customer: (i + 3) % customerIds.length,
    });
  }
  plan.push({ day: 0, time: "17:00", status: "confirmed", customer: 1 });

  const completed: { id: string; customer: string }[] = [];
  for (const [index, item] of plan.entries()) {
    const service = services[index % services.length]!;
    const professionalId = professionalIds[index % professionalIds.length]!;
    const customerId = customerIds[item.customer]!;
    const minutes = service.duration_minutes;
    let appointment: { id: string };
    try {
      appointment = await one<{ id: string }>(
        db,
        `insert into public.appointments (business_id, professional_id, customer_id, starts_at, ends_at, status, source,
           deposit_cents, deposit_status, deposit_expires_at, created_at)
         values ($3, $4, $5, ${LOCAL_TS}, ${LOCAL_TS} + make_interval(mins => $6::int), $7, 'chat',
           case when $7::text = 'awaiting_deposit' then 2000 else 0 end,
           case when $7::text = 'awaiting_deposit' then 'waiting' else 'none' end,
           case when $7::text = 'awaiting_deposit' then now() + interval '50 minutes' end,
           least(now(), ${LOCAL_TS} - interval '3 days'))
         returning id`,
        [
          item.day,
          item.time,
          businessId,
          professionalId,
          customerId,
          minutes,
          item.status === "completed" ? "confirmed" : item.status,
        ],
      );
    } catch {
      continue; // Overlap with another seeded slot: skip it.
    }
    await db.query(
      `insert into public.appointment_services (business_id, appointment_id, service_id, name, duration_minutes, price_cents)
       values ($1, $2, $3, $4, $5, $6)`,
      [businessId, appointment.id, service.id, service.name, minutes, service.price_cents],
    );
    if (item.status === "completed") {
      await db.query("update public.appointments set status = 'completed' where id = $1", [
        appointment.id,
      ]);
      completed.push({ id: appointment.id, customer: customerId });
    }
  }

  // Reviews for most completed appointments.
  for (const [index, appointment] of completed.slice(0, 7).entries()) {
    await db.query(
      `insert into public.reviews (business_id, appointment_id, customer_id, rating, comment, reply, created_at)
       values ($1, $2, $3, $4, $5, $6, now() - make_interval(days => $7::int))`,
      [
        businessId,
        appointment.id,
        appointment.customer,
        index === 5 ? 4 : 5,
        REVIEW_COMMENTS[index % REVIEW_COMMENTS.length],
        index === 0 ? "Obrigada pelo carinho! Volte sempre." : null,
        index * 5 + 2,
      ],
    );
  }

  // Finance: payment method on the automatic revenues, and monthly costs.
  await db.query(
    `update public.finance_entries
        set payment_method = (array['pix', 'pix', 'card', 'cash'])[1 + floor(random() * 4)::int]
      where business_id = $1 and random() < 0.85`,
    [businessId],
  );
  await db.query(
    `insert into public.finance_entries (business_id, kind, category, description, amount_cents, occurred_on)
     select $1, 'expense', c.category, c.description || ' ' || to_char(m.month, 'MM/YYYY'), c.amount, (m.month::date + c.day)
     from generate_series(date_trunc('month', current_date) - interval '2 months', date_trunc('month', current_date), interval '1 month') as m(month)
     cross join (values
       ('Aluguel', 'Aluguel', 180000, 4),
       ('Contas (luz, água, internet)', 'Luz e internet', 32000, 9),
       ('Produtos e materiais', 'Reposição de produtos', 45000, 14),
       ('Marketing', 'Impulsionamento no Instagram', 6000, 19)
     ) as c(category, description, amount, day)
     where (m.month::date + c.day) <= current_date`,
    [businessId],
  );
  await db.query(
    `insert into public.finance_entries (business_id, kind, category, description, amount_cents, occurred_on, payment_method, customer_id)
     values ($1, 'income', 'Venda de produto', 'Venda de kit de cuidados', 8900, current_date - 2, 'pix', $2)`,
    [businessId, customerIds[1]],
  );

  // Old "Pedir horário" requests (kept for history) and sales tools.
  await db.query(
    `insert into public.booking_requests (business_id, service_id, customer_name, phone, email, preferred_date, preferred_period, message, status, created_at) values
       ($1::uuid, $2::uuid, 'Gabriela Nunes', '5511977770001', 'gabi@exemplo.com', current_date + 2, 'morning', 'Pode ser cedinho?', 'new', now() - interval '2 hours'),
       ($1::uuid, $2::uuid, 'Roberta Silva', '5511977770002', null, current_date + 4, 'afternoon', null, 'new', now() - interval '1 day'),
       ($1::uuid, $3::uuid, 'Tatiane Prado', '5511977770003', 'tati@exemplo.com', current_date + 1, 'evening', 'Primeira vez aqui!', 'contacted', now() - interval '3 days')`,
    [businessId, services[0]!.id, services[1]!.id],
  );
  await db.query(
    `insert into public.business_coupons (business_id, code, discount_type, discount_value, valid_until, max_uses)
     values ($1::uuid, 'BEMVINDA10', 'percent', 10, now() + interval '30 days', 50), ($1::uuid, 'VOLTA20', 'fixed', 2000, null, null)`,
    [businessId],
  );
  const pkg = await one<{ id: string }>(
    db,
    `insert into public.packages (business_id, service_id, name, sessions, price_cents)
     values ($1, $2, $3, 5, $4) returning id`,
    [businessId, services[0]!.id, `Pacote 5x ${services[0]!.name}`, services[0]!.price_cents * 4],
  );
  await db.query(
    `insert into public.customer_packages (business_id, customer_id, package_id, sessions_left, sold_at)
     values ($1, $2, $3, 3, now() - interval '20 days')`,
    [businessId, customerIds[0], pkg.id],
  );
  await db.query(
    `insert into public.waitlist_entries (business_id, service_id, date, customer_name, phone, email)
     values ($1, $2, current_date + 1, 'Vanessa Araújo', '5511966660001', 'vanessa@exemplo.com')`,
    [businessId, services[0]!.id],
  );
  await db.query(
    `insert into public.abandoned_bookings (business_id, service_ids, date, customer_name, phone, email, consent, created_at)
     values ($1, array[$2::uuid], current_date + 3, 'Isabela Moura', '5511955550001', 'isa@exemplo.com', true, now() - interval '5 hours')`,
    [businessId, services[1]!.id],
  );

  // 60 days of anonymous page events (only counts are ever shown, rule 5).
  await db.query(
    `insert into public.page_events (business_id, type, session_id, occurred_at, outside_hours)
     select $1, t.type, gen_random_uuid(),
            date_trunc('day', now()) - make_interval(days => d) + make_interval(hours => 8 + (random() * 14)::int),
            random() < 0.25
     from generate_series(0, 59) d
     cross join lateral (
       select 'view' as type from generate_series(1, 25 + (random() * 30)::int)
       union all select 'click_whatsapp' from generate_series(1, 2 + (random() * 6)::int)
       union all select 'click_book' from generate_series(1, 3 + (random() * 8)::int)
       union all select 'click_instagram' from generate_series(1, 1 + (random() * 5)::int)
       union all select 'booking_started' from generate_series(1, 2 + (random() * 5)::int)
       union all select 'booking_confirmed' from generate_series(1, 1 + (random() * 3)::int)
     ) t`,
    [businessId],
  );

  return { businessId, professionalIds, services };
}

export async function seedDemo(db: PGlite): Promise<void> {
  const userIds = new Map<string, string>();
  for (const persona of DEMO_PERSONAS)
    userIds.set(persona.email, await createUser(db, persona.email));

  for (const seed of BUSINESSES) {
    const { businessId, professionalIds } = await seedBusiness(db, seed, userIds);
    if (seed.slug === "clinica-pele") {
      await db.query(
        "insert into public.members (business_id, user_id, role, professional_id) values ($1, $2, 'staff', $3)",
        [businessId, userIds.get("equipe.estetica@demo.com"), professionalIds[1]],
      );
    }
  }

  await db.query("select public.refresh_page_stats(current_date - 61)");
}
