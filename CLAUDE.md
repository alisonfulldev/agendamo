# Projeto: Lively — agenda e link de bio multimarcas

## Produto
Chat de agendamento + agenda + financeiro simples para qualquer negócio que trabalha com hora marcada (decidido em 2026-10-05). É um sistema só de agendamento e financeiro simples: nada específico de consultório (sem prontuário, recibo, termo, recorrência). Os recursos que já existem (ferramentas de venda, portal, pacotes, combos, cupons, sinal por Pix, avaliações, lista de espera) continuam; não criar recursos novos fora de agendamento e financeiro sem pedido.
Vendido como vários nichos (MARCAS), cada um com cores, textos e exemplos próprios, usando o MESMO sistema.
Segmentos (= nichos): beauty, barber, aesthetics, nails, lash_brow, tattoo, psychology, psychoanalysis, physio, nutrition, speech_therapy, occupational_therapy, psychopedagogy, dentistry, medical, podiatry, chiropractic, osteopathy, acupuncture, massage_therapy, integrative_therapy, pilates, yoga, personal_trainer, pet_grooming, veterinary, tutoring, photography, consulting, auto_detailing, sports_court. As chaves de marca usam hífen (lash-brow...). Nichos novos usam nicheBrand (src/brands/niche.ts: textos comuns, tipo "general" ou "health"); cada nicho tem um grupo (beleza, saúde, bem-estar, pets, serviços) para a lista do site.

Nome do produto: **MeetChat** (definido em 2026-10-04). O site tem uma página inicial genérica (/) que apresenta o sistema e vende para todos os nichos, e uma página por nicho (/beleza, /barbearia, /psicologia, /banho-e-tosa, /aulas...) com textos, cores e exemplos próprios. Os nichos são as "marcas" de src/brands (todas com nome "MeetChat"); a configuração da página inicial é src/brands/platform.ts (PLATFORM), que não é um nicho. O cadastro vindo de um nicho cria o negócio naquele nicho (/cadastro?brand=<chave>); da página inicial, /comecar pergunta o nicho antes.

Produto "chat primeiro" (confirmado em 2026-10-05, sem página do profissional): o link do negócio (/<slug>) abre direto no chat de agendamento; tocar na foto abre o perfil (estilo dados do contato); /<slug>/perfil é a versão indexável (portal e Google).

Site e cadastro (2026-10-06): a home (/) é uma página de vendas enxuta (textos em src/content/home.ts). Os botões abrem por cima do site a conversa de criação (?criar=1; ?nome= e ?ramo= pulam perguntas; textos e palavras-chave por nicho em src/content/creation.ts): nome → nicho detectado pelo nome ou escolhido ("Outro" = nicho "general", com o texto "o que você faz") → o chat vira o dela → tela de escolha: "Criar minha conta grátis" (principal) ou "Ver como meu cliente vai agendar" (simulação com agendamento fictício, avisando que o link ainda não foi criado) → WhatsApp (opcional) → e-mail (com sugestão de correção) → escolha do plano (Grátis, testar Agenda 7 dias, testar Pro 7 dias) → aceite dos termos (src/content/legal.ts) → código de 6 dígitos por e-mail (Supabase Auth OTP enviado pelo nosso e-mail; validade de 10 min, 5 tentativas e 30 s entre envios controlados na tabela email_codes) → conta e negócio criados na hora. Sem senha no cadastro (dá para criar em Conta); /entrar usa código por padrão, com senha como opção. Sem login com Google ou outro provedor por enquanto. Demonstrações ficam na tabela demos por 7 dias (limpeza diária). Nicho vazio ou desconhecido de um negócio cai em "Outro / Geral" via getNiche(). Uma conta tem um negócio só.

Três planos (igual em todas as marcas; decidido em 2026-10-10). Regras e preços em src/lib/plans.ts (PLAN_PRICES, PRICE_TEXT, getPlanFeatures); textos usam PRICE_TEXT, nunca valores escritos à mão.
- Grátis (para sempre): 10 agendamentos automáticos (chat) a cada ciclo de 30 dias contado da data de cadastro, no fuso do negócio (src/lib/plan-cycle.ts; contagem no servidor em src/lib/plan-usage.ts). Passado o limite, o chat entra no modo WhatsApp até o fim do ciclo (serviço, dia, turno e nome → wa.me com mensagem pronta; nada é gravado). Rodapé "Agende também com o MeetChat", sem lembretes, sem chat no site. Só chat e agenda (mais Meu perfil, Configurações, Notificações, Assinatura e Conta); o resto fica com cadeado e modal de assinatura (layouts por módulo + requireFeature nas ações).
- Agenda: R$ 19,90/mês ou R$ 14,90/mês no anual. Ilimitado, lembretes, sem marca, chat no site, clientes, financeiro, vendas, equipe, Google Agenda. Sem sinal.
- Pro: R$ 39,90/mês ou R$ 29,90/mês no anual. Tudo do Agenda + sinal ou pagamento total pelo cliente (etapa separada; até lá DEPOSITS_ENABLED = false e aparece como "em breve").
- 1 profissional incluso no Agenda e no Pro; cada extra R$ 9/mês (R$ 90/ano). Grátis: 1 profissional.
- Teste de 7 dias do Agenda ou do Pro, sem cartão, uma vez por pessoa (hashes de e-mail, telefone e CPF/CNPJ em trial_claims). Escolha no cadastro (conversa e formulário): Grátis, teste Agenda ou teste Pro; quem escolhe Grátis pode iniciar o teste depois pelo painel. Contador no painel; avisos por e-mail e push no dia 5, no dia 6 e no fim (cron trial). Sem pagamento, a conta cai sozinha no Grátis; nada é apagado.
- Assinatura: ciclo começa na data da assinatura, sem cobrança proporcional; libera na hora ao pagar. Upgrade Agenda → Pro imediato (novo valor a partir da próxima cobrança); downgrade Pro → Agenda no fim do período pago (subscriptions.pending_plan). Cancelamento mantém o plano até o fim do período pago e depois volta ao Grátis. Assinante não tem limite nem contador.
- No banco: businesses.plan "free" (também durante o teste; trial_plan diz qual), "agenda" ou "pro" ("team" é legado = pro); businesses.signup_choice guarda a escolha do cadastro (métricas do admin); businesses.professional_seats = profissionais pagos.
- Adicional: Destaque no portal (R$ 49/mês por cidade). Domínio próprio não é vendido (2026-10-06).
- Suporte só por e-mail: contato@brandcodesolutions.com.br (sem WhatsApp de contato).
- Cupons de desconto na assinatura.

Canais:
- Avisos para a dona e equipe: SOMENTE e-mail e notificação web (push). Nunca WhatsApp, nunca SMS.
- Clientes finais: só e-mails necessários (confirmação, lembrete, cancelamento). Sem e-mail de marketing (confirmado em 2026-10-05).
- WhatsApp apenas como link comum wa.me aberto manualmente pela pessoa. Sem API.

## Stack fixa (não trocar, não adicionar bibliotecas sem perguntar)
Next.js App Router + TypeScript strict; Supabase na nuvem (Postgres, Auth, RLS, pg_cron, pg_net);
Supabase CLI apenas para migrations remotas (sem Docker, sem supabase start);
Cloudflare R2 para imagens via @aws-sdk/client-s3 e @aws-sdk/s3-request-presigner;
Tailwind + shadcn/ui; zod; date-fns + date-fns-tz; Resend; web-push; Vitest; Playwright; Sentry; deploy na Vercel.

## Idioma
Código, tabelas e arquivos em inglês. Interface em português do Brasil.

## Regras críticas
1. Multi-inquilino: toda tabela de negócio tem business_id e RLS. Um negócio nunca acessa dados de outro.
2. Sem horário duplicado: EXCLUDE USING gist por profissional (e por recurso) com tstzrange para status ativos. Tratar conflito com mensagem amigável.
3. Datas em UTC (timestamptz). Cada business tem timezone (padrão America/Sao_Paulo).
4. Horário só é oferecido se duração + intervalo couberem inteiros, fora de pausas, bloqueios, agendamentos, recursos ocupados e compromissos do Google Agenda. Grade 15/30/60. Respeitar antecedência mínima e limite futuro.
5. Estatísticas sem identificar visitantes: só contagens, horários e id de sessão anônimo. Ignorar dona logada e robôs. Números agregados abaixo de 5 nunca são exibidos.
6. Recursos de plano verificados no servidor (nunca só na interface) por getPlanFeatures.
7. Imagens comprimidas no navegador (WebP via canvas nativo) e enviadas direto ao R2 por URL assinada gerada no servidor. Nunca passar arquivo pelo servidor Next. Limites por plano validados no servidor.
8. Tarefas agendadas: pg_cron + pg_net chamando rotas /api/cron/* protegidas por CRON_SECRET. Todas idempotentes.
9. Toda entrada validada com zod no servidor. Rotas públicas e de autenticação com limite de chamadas.
10. E-mails de marketing só com opt-in e descadastro com um clique.
11. Pix do sinal é pago direto ao profissional. A plataforma nunca recebe dinheiro de cliente final.
12. Páginas do portal só indexáveis com conteúdo mínimo; caso contrário, noindex e fora do sitemap.
13. Registrar em audit_log ações sensíveis (plano, exclusões, permissões, ações de administrador).
14. Multimarcas: um único projeto Next.js e um único banco atendem várias marcas, cada uma com domínio próprio. O proxy (antigo middleware) identifica a marca pelo cabeçalho Host e carrega a configuração de src/brands. Nunca duplicar código por marca: diferenças ficam só na configuração da marca. Todo negócio pertence a uma marca (brand_key) e sua página, painel e e-mails usam essa marca. Nenhuma cor fixa fora dos arquivos de marca. Todo cache inclui brand.key na chave. Links absolutos (e-mails etc.) são montados a partir do domínio da marca do negócio.

## Como trabalhar
- Os prompts de todas as etapas estão em docs/PROMPTS.md. Use esse arquivo só como referência; execute apenas o prompt que for pedido.
- Uma tarefa por vez, exatamente como pedida. Não adiantar etapas.
- Antes de mexer em banco, autenticação, imagens, pagamentos, domínios ou integrações externas: mostre o plano e espere aprovação.
- Não invente APIs; se não tiver certeza, consulte a documentação da versão instalada e diga.
- Nunca edite migration aplicada; crie outra.
- Não rode comandos de git; o versionamento é feito manualmente.
- Ao terminar: lint, typecheck e testes passando; liste arquivos alterados e pendências.
- Se algo estiver ambíguo, pergunte.