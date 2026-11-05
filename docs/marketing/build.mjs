// Gera as peças de venda do MeetChat (2026-11-06): a apresentação para mandar no WhatsApp e os
// criativos do Meta Ads. Rodar na raiz do projeto: `node docs/marketing/build.mjs`.
// Usa as fotos de tela de docs/marketing/shots (tiradas dos sites de exemplo no ar).
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

// Preços (mesmos de src/lib/plans.ts). Mudou lá, mude aqui e gere de novo.
const PRICE = { site: "R$ 49", domain: "R$ 91/ano", customSite: "R$ 148" };

const C = { primary: "#4338CA", lime: "#CBEF4A", deep: "#1B1464", bg: "#F8F9FC", ink: "#14123A" };
const img = (name) => `data:image/png;base64,${readFileSync(`docs/marketing/shots/${name}.png`).toString("base64")}`;
const logo = `<svg viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="16" fill="${C.primary}"/><circle cx="18" cy="32" r="6" fill="${C.bg}"/><circle cx="32" cy="32" r="6" fill="${C.bg}"/><circle cx="46" cy="32" r="6" fill="${C.bg}"/></svg>`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800;900&family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Figtree:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Figtree, sans-serif; }
.slide { position: relative; overflow: hidden; display: flex; flex-direction: column; padding: 80px; }
.title { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; letter-spacing: -0.02em; line-height: 0.98; }
.brand { display: flex; align-items: center; gap: 16px; font-weight: 800; font-size: 34px; }
.brand svg { width: 52px; height: 52px; }
.phone { border-radius: 64px; border: 14px solid #0d0d14; overflow: hidden; background: #0d0d14; box-shadow: 0 40px 80px rgba(0,0,0,.35); }
.phone img { display: block; width: 100%; }
.pill { display: inline-flex; align-items: center; gap: 12px; border-radius: 999px; font-weight: 800; }
.check { display: flex; gap: 18px; align-items: flex-start; font-size: 38px; font-weight: 600; line-height: 1.25; }
.check b { flex: none; width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; }
.card { border-radius: 32px; padding: 30px 32px; }
.card h3 { font-size: 34px; font-weight: 800; line-height: 1.15; }
.card p { margin-top: 8px; font-size: 25px; line-height: 1.35; opacity: .8; }
.chat { background: #f6eef2; border-radius: 36px; padding: 28px; display: flex; flex-direction: column; gap: 14px; }
.b { max-width: 82%; padding: 16px 22px; border-radius: 22px; font-size: 30px; line-height: 1.3; box-shadow: 0 2px 4px rgba(0,0,0,.08); }
.b.in { background: #fff; color: #1d1b2e; border-top-left-radius: 6px; }
.b.out { background: #e7dcf7; color: #1d1b2e; align-self: flex-end; border-top-right-radius: 6px; }
.opts { display: flex; gap: 10px; align-self: flex-end; }
.opt { background: #fff; border-radius: 16px; padding: 12px 20px; font-size: 26px; font-weight: 600; color: #1d1b2e; }
`;

const chat = (scale = 1) => `
<div class="chat" style="font-size:${scale}em">
  <div class="b in">Oi! 👋 Você está na agenda do Studio Bela. Qual serviço você quer agendar?</div>
  <div class="b out">Manicure</div>
  <div class="b in">Esses são os horários livres na sexta:</div>
  <div class="opts"><span class="opt">09:00</span><span class="opt">14:00</span><span class="opt">16:30</span></div>
  <div class="b out">14:00</div>
  <div class="b in">Prontinho, Mariana! Seu horário está confirmado. ✅</div>
</div>`;

// ---------------------------------------------------------------------------------------------
// Apresentação (1080x1350), para mandar no WhatsApp: o sistema, os módulos e os benefícios.
const deck = [
  // 1. Capa
  `<div class="slide" style="width:1080px;height:1350px;background:${C.lime};color:${C.deep}">
    <div class="brand">${logo}MeetChat</div>
    <h1 class="title" style="font-size:112px;margin-top:70px">Seu site +<br/>agenda online</h1>
    <p style="font-size:42px;font-weight:600;margin-top:34px;max-width:620px;line-height:1.3">Seus clientes marcam sozinhos, 24 horas. Você só atende.</p>
    <div class="phone" style="position:absolute;right:-30px;bottom:-260px;width:470px;transform:rotate(-6deg)"><img src="${img("site-beleza-elegante")}"/></div>
    <div class="pill" style="position:absolute;left:80px;bottom:90px;background:${C.deep};color:${C.lime};font-size:34px;padding:22px 34px">Agenda 24h · Site no Google</div>
  </div>`,
  // 2. Como funciona
  `<div class="slide" style="width:1080px;height:1350px;background:${C.deep};color:#fff">
    <h2 class="title" style="font-size:96px;color:${C.lime}">Como funciona</h2>
    <div style="display:flex;flex-direction:column;gap:30px;margin-top:50px;max-width:900px">
      ${[
        ["1", "Você divulga seu link", "Na bio do Instagram, no WhatsApp e no Google."],
        ["2", "O cliente escolhe", "Serviço, dia e um horário livre, em 1 minuto."],
        ["3", "Pronto, está marcado", "Ele recebe a confirmação e você, um aviso no celular."],
      ].map(([n, t, d]) => `<div style="display:flex;gap:24px"><span class="title" style="flex:none;width:76px;height:76px;border-radius:50%;background:${C.lime};color:${C.deep};display:flex;align-items:center;justify-content:center;font-size:44px">${n}</span><div><p style="font-size:40px;font-weight:800">${t}</p><p style="font-size:30px;opacity:.8;margin-top:6px;line-height:1.3">${d}</p></div></div>`).join("")}
    </div>
    <div style="position:absolute;right:70px;bottom:60px;width:560px;transform:scale(.86);transform-origin:bottom right">${chat(1)}</div>
    <p style="position:absolute;left:80px;bottom:80px;font-size:32px;font-weight:700;color:${C.lime};max-width:340px;line-height:1.3">Sem baixar aplicativo. Sem criar conta.</p>
  </div>`,
  // 3. Módulos do sistema
  `<div class="slide" style="width:1080px;height:1350px;background:${C.bg};color:${C.ink}">
    <h2 class="title" style="font-size:80px">Tudo que vem no plano</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:40px">
      ${[
        ["🌐", "Site pronto para o Google", "Na sua cor, com serviços, fotos e avaliações."],
        ["💬", "Agendamento por chat 24h", "O cliente marca sozinho, até de madrugada."],
        ["🔔", "Lembretes automáticos", "Confirmação e lembrete por e-mail: menos faltas."],
        ["📱", "Aviso no seu celular", "Cada agendamento, cancelamento e remarcação."],
        ["📅", "Agenda e equipe", "Vários profissionais, folgas e bloqueios."],
        ["👥", "Clientes", "Histórico de cada cliente, num lugar só."],
        ["💰", "Financeiro simples", "Entradas, saídas e o resultado do mês."],
        ["⚡", "Sinal pelo Pix", "Cobre um sinal para garantir o horário."],
      ].map(([e, t, d]) => `<div class="card" style="background:#fff;padding:24px 28px;box-shadow:0 2px 0 rgba(20,18,58,.06)"><p style="font-size:38px">${e}</p><h3 style="margin-top:6px;font-size:31px">${t}</h3><p style="font-size:23px">${d}</p></div>`).join("")}
    </div>
  </div>`,
  // 4. Vender mais
  `<div class="slide" style="width:1080px;height:1350px;background:${C.primary};color:#fff">
    <h2 class="title" style="font-size:92px">Ferramentas para<br/><span style="color:${C.lime}">vender mais</span></h2>
    <div style="display:flex;flex-direction:column;gap:26px;margin-top:60px">
      ${[
        ["Cupons de desconto", "para trazer cliente novo"],
        ["Pacotes de sessões", "o cliente paga e volta"],
        ["Lista de espera", "avisada sozinha quando abre um horário"],
        ["Clientes que sumiram", "quem está na hora de voltar"],
        ["Indicações", "cliente trazendo cliente"],
        ["Avaliações", "as estrelas aparecem no seu site"],
        ["Artes para stories", "com seus horários livres do dia"],
        ["Google Agenda", "seus compromissos sem conflito"],
      ].map(([t, d]) => `<div class="check"><b style="background:${C.lime};color:${C.deep}">✓</b><span><strong>${t}</strong> <span style="opacity:.75;font-weight:500">· ${d}</span></span></div>`).join("")}
    </div>
  </div>`,
  // 5. Benefícios
  `<div class="slide" style="width:1080px;height:1350px;background:${C.lime};color:${C.deep}">
    <h2 class="title" style="font-size:96px">O que muda<br/>no seu dia</h2>
    <div style="display:flex;flex-direction:column;gap:30px;margin-top:56px;max-width:600px">
      ${[
        "Chega de responder “tem horário?” o dia todo",
        "Agenda cheia até quando você está dormindo",
        "Menos faltas, com lembrete e sinal pelo Pix",
        "Seu negócio aparece no Google com um site seu",
        "Imagem profissional: link e site com a sua cara",
      ].map((t) => `<div class="check"><b style="background:${C.deep};color:${C.lime}">✓</b><span>${t}</span></div>`).join("")}
    </div>
    <div class="phone" style="position:absolute;right:-60px;bottom:-200px;width:420px;transform:rotate(5deg)"><img src="${img("site-barbearia")}"/></div>
  </div>`,
  // 6. Preço e chamada
  `<div class="slide" style="width:1080px;height:1350px;background:${C.deep};color:#fff;justify-content:center">
    <p style="font-size:40px;font-weight:700;color:${C.lime}">Site + Agenda</p>
    <p class="title" style="font-size:210px;color:${C.lime};margin-top:10px">${PRICE.site}<span style="font-size:70px">/mês</span></p>
    <div style="display:flex;flex-direction:column;gap:22px;margin-top:40px">
      ${[
        "Tudo o que você viu, sem taxa de criação",
        "Sem fidelidade: cancela quando quiser",
        `Seu próprio endereço .com.br: + ${PRICE.domain} (opcional)`,
        `Site personalizado com a sua cara: + ${PRICE.customSite} (opcional)`,
      ].map((t) => `<div class="check" style="font-size:34px"><b style="background:${C.lime};color:${C.deep}">✓</b><span>${t}</span></div>`).join("")}
    </div>
    <div class="pill" style="margin-top:70px;align-self:flex-start;background:${C.lime};color:${C.deep};font-size:34px;padding:26px 40px;white-space:nowrap">Responda aqui e eu deixo o seu pronto hoje →</div>
  </div>`,
];

// ---------------------------------------------------------------------------------------------
// Criativos do Meta Ads (tráfego para o WhatsApp, venda no x1).
const ads = {
  // A: a dor ("tem horário?"), com o chat.
  "feed-dor": `<div class="slide" style="width:1080px;height:1350px;background:${C.lime};color:${C.deep}">
    <h1 class="title" style="font-size:104px">Chega de responder<br/>“tem horário?”<br/>o dia todo</h1>
    <p style="font-size:38px;font-weight:600;margin-top:30px;max-width:900px;line-height:1.3">Seu cliente agenda sozinho pelo seu link, 24h. E você ganha um site pronto para o Google.</p>
    <div style="position:absolute;left:80px;right:80px;bottom:200px">${chat(0.95)}</div>
    <div style="position:absolute;left:80px;right:80px;bottom:70px;display:flex;justify-content:space-between;align-items:center">
      <span class="pill" style="background:${C.deep};color:${C.lime};font-size:36px;padding:22px 36px">Site + Agenda por ${PRICE.site}/mês</span>
      <span style="font-size:30px;font-weight:700">Sem fidelidade</span>
    </div>
  </div>`,
  // B: a oferta, com o site e o chat.
  "feed-oferta": `<div class="slide" style="width:1080px;height:1350px;background:${C.deep};color:#fff">
    <div class="brand" style="color:#fff">${logo}MeetChat</div>
    <h1 class="title" style="font-size:96px;margin-top:40px">Seu site pronto<br/>+ <span style="color:${C.lime}">agenda online</span></h1>
    <p class="title" style="font-size:120px;color:${C.lime};margin-top:24px">${PRICE.site}<span style="font-size:48px">/mês</span></p>
    <p style="font-size:34px;font-weight:600;margin-top:18px;opacity:.9">Seus clientes agendam sozinhos, 24h · Pronto hoje</p>
    <div class="phone" style="position:absolute;left:100px;bottom:-200px;width:420px;transform:rotate(-5deg)"><img src="${img("site-barbearia")}"/></div>
    <div class="phone" style="position:absolute;right:100px;bottom:-160px;width:420px;transform:rotate(5deg)"><img src="${img("site-nutricao")}"/></div>
    <span class="pill" style="position:absolute;right:80px;top:96px;background:${C.lime};color:${C.deep};font-size:30px;padding:16px 28px">Sem fidelidade</span>
  </div>`,
  // Stories / Reels (1080x1920): textos fora das áreas cobertas no topo e no rodapé.
  "stories": `<div class="slide" style="width:1080px;height:1920px;background:${C.lime};color:${C.deep};padding:260px 80px 360px">
    <h1 class="title" style="font-size:110px">Seu cliente marca.<br/>Você só atende.</h1>
    <p style="font-size:42px;font-weight:600;margin-top:30px;line-height:1.3">Site + agenda online por ${PRICE.site}/mês. Sem fidelidade.</p>
    <div style="margin:50px auto 0;width:600px;height:860px;overflow:hidden;border-radius:64px 64px 0 0"><div class="phone" style="width:600px;border-bottom:none"><img src="${img("site-beleza-elegante")}"/></div></div>
    <div class="pill" style="margin-top:40px;justify-content:center;background:${C.deep};color:${C.lime};font-size:40px;padding:30px">Toque e chame no WhatsApp →</div>
  </div>`,
};

// ---------------------------------------------------------------------------------------------
// "Oferta" por ramo (2026-11-06): a peça do feed-oferta, falando com o ramo, em 3 formatos, nas
// cores da TopSite (a conta que anuncia): amarelo e preto, sem o logo do MeetChat.
const T = { bg: "#FCD901", ink: "#111111" };
const NICHE_ADS = [
  {
    file: "psicologia",
    title: `Site + agenda online<br/>para <span class="hl">psicólogos</span>`,
    sub: "Seus pacientes agendam sozinhos, 24 horas",
    shots: ["site-psicologia", "site-psicologia-elegante"],
  },
];

const FORMATS = {
  quadrado: { width: 1080, height: 1080, title: 76, price: 104, sub: 30, phone: 360, phoneBottom: -300, pad: 70 },
  retrato: { width: 1080, height: 1350, title: 88, price: 120, sub: 34, phone: 420, phoneBottom: -200, pad: 80 },
  story: { width: 1080, height: 1920, title: 96, price: 140, sub: 38, phone: 430, phoneBottom: -40, pad: 80, top: 250 },
};

function nicheOffer(n, fmt) {
  const f = FORMATS[fmt];
  const side = fmt === "quadrado" ? 120 : fmt === "story" ? 60 : 100;
  return `<div class="slide" style="width:${f.width}px;height:${f.height}px;background:${T.bg};color:${T.ink};padding:${f.top ?? f.pad}px ${f.pad}px ${f.pad}px">
    <style>.hl { background: ${T.ink}; color: ${T.bg}; padding: 0 .14em; border-radius: .12em; }</style>
    <span class="pill" style="align-self:flex-start;background:${T.ink};color:${T.bg};font-size:28px;padding:14px 26px">Sem fidelidade · Pronto hoje</span>
    <h1 class="title" style="font-size:${f.title}px;margin-top:${fmt === "quadrado" ? 26 : 40}px;line-height:1.06">${n.title}</h1>
    <p class="title" style="font-size:${f.price}px;margin-top:${fmt === "quadrado" ? 14 : 24}px">${PRICE.site}<span style="font-size:${Math.round(f.price * 0.4)}px">/mês</span></p>
    <p style="font-size:${f.sub}px;font-weight:700;margin-top:14px">${n.sub}</p>
    ${fmt === "story" ? `<div class="pill" style="margin-top:36px;align-self:flex-start;background:${T.ink};color:${T.bg};font-size:36px;padding:24px 36px">Toque e chame no WhatsApp →</div>` : ""}
    <div class="phone" style="position:absolute;left:${side}px;bottom:${f.phoneBottom - 40}px;width:${f.phone}px;transform:rotate(-5deg)"><img src="${img(n.shots[0])}"/></div>
    <div class="phone" style="position:absolute;right:${side}px;bottom:${f.phoneBottom}px;width:${f.phone}px;transform:rotate(5deg)"><img src="${img(n.shots[1])}"/></div>
  </div>`;
}

// ---------------------------------------------------------------------------------------------
// "Clássico" (2026-11-06): o anúncio que sempre converteu ("Seu SITE por apenas R$ 49/mês"), com
// as informações novas: site + agenda online, sem fidelidade. Fundo claro, título serifado preto
// com sombra amarela, selo amarelo e três vantagens com ícones.
const Y = "#FCD901";
const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 15l2.5 2.5L16 13"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V14M10 20V10M16 20V12M22 20H2M3 9l6-5 4 4 8-6M17 2h4v4"/></svg>`,
};
const CLASSIC_FORMATS = {
  quadrado: { width: 1080, height: 1080, scale: 1, top: 70 },
  retrato: { width: 1080, height: 1350, scale: 1.18, top: 0, center: true },
  story: { width: 1080, height: 1920, scale: 1.22, top: 0, center: true },
};
function classic(fmt) {
  const f = CLASSIC_FORMATS[fmt];
  const k = f.scale;
  const serif = "font-family:'Playfair Display',serif;font-weight:900;letter-spacing:-0.015em;color:#111;text-shadow:7px 7px 0 " + Y;
  const perk = (icon, text) => `<div style="display:flex;align-items:center;gap:18px"><span style="width:70px;height:70px;flex:none">${icon}</span><span style="font-size:30px;font-weight:600;line-height:1.15;color:#111">${text}</span></div>`;
  return `<div class="slide" style="width:${f.width}px;height:${f.height}px;padding:${f.top}px 60px 60px;align-items:center;text-align:center;${f.center ? "justify-content:center;" : ""}
      background:radial-gradient(120% 60% at 50% 0%, #ffffff 0%, #f1f1f1 55%, #e9e9e9 100%)">
    <div style="position:absolute;inset:-200px;background:repeating-radial-gradient(ellipse at 50% -10%, rgba(0,0,0,.035) 0 2px, transparent 2px 60px);pointer-events:none"></div>
    <p style="${serif};font-size:${150 * k}px;line-height:.95">Seu SITE</p>
    <p style="${serif};font-size:${86 * k}px;line-height:1;margin-top:${6 * k}px">+ agenda online</p>
    <p style="font-family:'Playfair Display',serif;font-weight:800;font-size:${64 * k}px;color:#111;margin-top:${18 * k}px;line-height:1;display:inline-block;padding-bottom:10px;background:linear-gradient(${Y},${Y}) bottom/100% 12px no-repeat">por apenas</p>
    <p style="${serif};font-size:${210 * k}px;line-height:1;margin-top:${10 * k}px;white-space:nowrap">R$49<span style="font-size:${96 * k}px">/mês</span></p>
    <div style="display:flex;align-items:center;gap:26px;margin-top:${26 * k}px">
      <span style="color:${Y};font-size:${60 * k}px;font-weight:900">\\</span>
      <span class="pill" style="background:${Y};color:#111;font-size:${50 * k}px;font-weight:800;padding:${18 * k}px ${54 * k}px">pronto em 24h</span>
      <span style="color:${Y};font-size:${60 * k}px;font-weight:900">//</span>
    </div>
    <p style="font-size:${30 * k}px;font-weight:700;color:#111;margin-top:${18 * k}px">sem fidelidade · cancele quando quiser</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;margin-top:${46 * k}px;width:100%;text-align:left">
      ${perk(ICON.search, "pronto para o Google")}
      ${perk(ICON.calendar, "clientes agendam sozinhos 24h")}
      ${perk(ICON.chart, "sua empresa vendendo mais")}
    </div>
    ${fmt === "story" ? `<div class="pill" style="margin-top:60px;background:#111;color:${Y};font-size:40px;padding:28px 44px">Toque e chame no WhatsApp →</div>` : ""}
  </div>`;
}

// ---------------------------------------------------------------------------------------------
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function render(html, width, height, file) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<html><head><style>${CSS}</style></head><body>${html}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
}

// ONLY=nichos gera só as peças por ramo.
// ONLY=classico gera só o anúncio clássico.
const onlyNiches = process.env.ONLY === "nichos" || process.env.ONLY === "classico";
const skipNiches = process.env.ONLY === "classico";
mkdirSync("docs/marketing/apresentacao", { recursive: true });
mkdirSync("docs/marketing/anuncios", { recursive: true });
for (const [i, html] of onlyNiches ? [] : deck.entries()) {
  await render(html, 1080, 1350, `docs/marketing/apresentacao/${String(i + 1).padStart(2, "0")}.png`);
}
// The deck as one PDF too (one slide per page).
if (!onlyNiches) await page.setContent(
  `<html><head><style>${CSS} @page { size: 1080px 1350px; margin: 0 } .slide { page-break-after: always }</style></head><body>${deck.join("")}</body></html>`,
  { waitUntil: "networkidle" },
);
if (!onlyNiches) await page.evaluate(() => document.fonts.ready);
if (!onlyNiches) await page.pdf({ path: "docs/marketing/apresentacao/MeetChat-apresentacao.pdf", width: "1080px", height: "1350px", printBackground: true });

for (const [name, html] of onlyNiches ? [] : Object.entries(ads)) {
  const height = name === "stories" ? 1920 : 1350;
  await render(html, 1080, height, `docs/marketing/anuncios/${name}.png`);
}
mkdirSync("docs/marketing/anuncios/nichos", { recursive: true });
for (const n of skipNiches ? [] : NICHE_ADS) {
  for (const [fmt, f] of Object.entries(FORMATS)) {
    await render(nicheOffer(n, fmt), f.width, f.height, `docs/marketing/anuncios/nichos/${n.file}-${fmt}.png`);
  }
}
for (const [fmt, f] of Object.entries(CLASSIC_FORMATS)) {
  await render(classic(fmt), f.width, f.height, `docs/marketing/anuncios/classico-${fmt}.png`);
}
await browser.close();
console.log("ok");
