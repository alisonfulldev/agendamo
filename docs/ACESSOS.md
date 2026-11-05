# Inventário de acessos do MeetChat

Levantado em 04/11/2026. **Este arquivo não tem nenhuma senha nem chave**: só o que existe, para
que serve, onde está configurado e qual conta é dona. As senhas e chaves ficam num gerenciador de
senhas (veja "Como guardar" no fim). Onde está "preencher", só você sabe: complete e mantenha
atualizado.

## Código e publicação

| Serviço | Para que serve | Conta / identificação | Onde entra |
|---|---|---|---|
| **GitHub** | Guarda o código e todo o histórico | repositório `alisonfulldev/agendamo`, conta `alisonfulldev` | github.com |
| **Vercel** | Publica o site e o sistema | time `alisons-projects-f1b1b5e6`, usuário `alisonfulldev-6869`, projeto `agendamo` | vercel.com |
| **Domínios** (`meetchat.com.br`, `brandcodesolutions.com.br`) | Endereço do site e do e-mail de contato | Registro.br (DNS `a.sec.dns.br` / `b.sec.dns.br`); titular: preencher | registro.br |

## Banco, arquivos e e-mail

| Serviço | Para que serve | Conta / identificação | Variáveis (na Vercel e no `.env.local`) |
|---|---|---|---|
| **Supabase** | Banco de dados e login | projeto `cloorbuzuuoohnvwjyxr`; conta: preencher | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` (só local, para as migrations) |
| **Cloudflare R2** | Fotos (perfil, capa, galeria) e comprovantes | bucket `meetchat`; conta Cloudflare: preencher | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` |
| **Resend** | Envia os e-mails (códigos, lembretes, avisos) | conta: preencher; remetente atual no `.env.local`: `nao-responda@topsitebr.com.br` | `RESEND_API_KEY`, `RESEND_FROM` |
| **E-mail de suporte** | Atendimento | `contato@brandcodesolutions.com.br`; provedor: preencher | (texto no site) |

## Pagamentos

| Serviço | Para que serve | Conta / identificação | Variáveis |
|---|---|---|---|
| **Asaas** | Assinaturas (Pix Automático) | conta PJ de produção; e-mail: preencher. Também cobra TopSite e Site no Ar | `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_ENV`; webhook "agendamo" no painel do Asaas |

## Segurança interna (gerados por nós; sem conta externa)

| Chave | Para que serve | Atenção |
|---|---|---|
| `ENCRYPTION_KEY` | Criptografa dados guardados no banco (como a ligação com o Google Agenda) | **Se perder, esses dados não voltam.** Guarde com prioridade |
| `CRON_SECRET` | Protege as tarefas automáticas (lembretes, cobranças) | Precisa ser igual na Vercel e nas tarefas do Supabase (pg_cron) |
| `INDEXNOW_KEY` | Avisa o Bing quando uma página muda | Pode ser recriada |
| `VAPID` (pública e privada) | Notificações no celular (push) | Ver pendência abaixo |

## Marketing e medição

| Serviço | Identificação | Conta |
|---|---|---|
| Google Analytics 4 | `G-C0JT6XWNSM` | preencher |
| Google Ads | `AW-18534935387` (conversão de cadastro) | preencher (a tag foi criada em outra conta Google) |
| Google Search Console | `meetchat.com.br` | preencher |
| Meta (Facebook/Instagram) | Portfólio "MeetChat", conta de anúncios `1156320070288838`, pixel `3760458420790268` (criado na conta pessoal `1131827055736414`), Página MeetChat, Instagram `@meetchat.oficial` | perfil Facebook "Thassia Minervino" |
| WhatsApp de vendas | (18) 99674-2364 | — |

## Administração do MeetChat

- Painel admin: `meetchat.com.br/admin/entrar`, conta **alisonlima977@gmail.com** (cadastrada como admin no banco).
- E-mails de aviso aos admins (novo cadastro, site pago) vão para `ADMIN_EMAILS` na Vercel.

## Pendências encontradas no levantamento

1. **Variáveis que não estão na Vercel (produção):** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (notificações no celular), `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (Google Agenda) e `NEXT_PUBLIC_SENTRY_DSN` (registro de erros). Conferir se esses recursos estão funcionando em produção.
2. **Remetente dos e-mails:** o `.env.local` usa `Agendamo <nao-responda@topsitebr.com.br>`. Conferir o valor em produção; o ideal é um endereço do domínio do MeetChat.
3. **Envio ao GitHub:** o Git deste computador não consegue enviar com o certificado padrão. Funciona com `git -c http.sslBackend=schannel push`. Para deixar fixo neste projeto: `git config http.sslBackend schannel`.

## Como guardar (recomendado)

1. **Gerenciador de senhas** (Bitwarden, que é grátis, ou 1Password): uma entrada por serviço acima, com e-mail de acesso, senha e os **códigos de recuperação da verificação em duas etapas**.
2. **Cópia das chaves:** salve o conteúdo do `.env.local` como uma nota segura no gerenciador. As chaves de produção também podem ser baixadas da Vercel com `vercel env pull`, desde que você tenha acesso à conta.
3. **Verificação em duas etapas** em todos: GitHub, Vercel, Supabase, Cloudflare, Resend, Asaas, Google e Meta.
4. **Um segundo admin de confiança** (ou um segundo e-mail seu) em GitHub, Vercel e Supabase, para não depender de um único login.
5. **Nunca** coloque senhas neste arquivo nem no código: ele vai para o GitHub.
