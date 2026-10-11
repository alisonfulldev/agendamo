# Projeto: Lively — agenda e link de bio multimarcas

## Produto
Chat de agendamento + agenda + financeiro simples para qualquer negócio que trabalha com hora marcada (decidido em 2026-10-05). É um sistema só de agendamento e financeiro simples: nada específico de consultório (sem prontuário, recibo, termo, recorrência). Os recursos que já existem (ferramentas de venda, portal, pacotes, combos, cupons, sinal por Pix, avaliações, lista de espera) continuam; não criar recursos novos fora de agendamento e financeiro sem pedido.
Vendido como vários nichos (MARCAS), cada um com cores, textos e exemplos próprios, usando o MESMO sistema.
Segmentos (= nichos): beauty, barber, aesthetics, nails, lash_brow, tattoo, psychology, psychoanalysis, physio, nutrition, speech_therapy, occupational_therapy, psychopedagogy, dentistry, medical, podiatry, chiropractic, osteopathy, acupuncture, massage_therapy, integrative_therapy, pilates, yoga, personal_trainer, pet_grooming, veterinary, tutoring, photography, consulting, auto_detailing, sports_court. As chaves de marca usam hífen (lash-brow...). Nichos novos usam nicheBrand (src/brands/niche.ts: textos comuns, tipo "general" ou "health"); cada nicho tem um grupo (beleza, saúde, bem-estar, pets, serviços) para a lista do site.

Nome do produto: **MeetChat** (definido em 2026-10-04). O site tem uma página inicial genérica (/) que apresenta o sistema e vende para todos os nichos, e uma página por nicho (/beleza, /barbearia, /psicologia, /banho-e-tosa, /aulas...) com textos, cores e exemplos próprios. Os nichos são as "marcas" de src/brands (todas com nome "MeetChat"); a configuração da página inicial é src/brands/platform.ts (PLATFORM), que não é um nicho. O cadastro vindo de um nicho cria o negócio naquele nicho (/cadastro?brand=<chave>); da página inicial, /comecar pergunta o nicho antes.

Produto "chat primeiro" (confirmado em 2026-10-05, sem página do profissional): o link do negócio (/<slug>) abre direto no chat de agendamento; tocar na foto abre o perfil (estilo dados do contato); /<slug>/perfil é a versão indexável (portal e Google).

Site e cadastro (2026-10-06): a home (/) é uma página de vendas enxuta (textos em src/content/home.ts). Os botões abrem por cima do site a conversa de criação (?criar=1; ?nome= e ?ramo= pulam perguntas; textos e palavras-chave por nicho em src/content/creation.ts): nome → nicho detectado pelo nome ou escolhido ("Outro" = nicho "general", com o texto "o que você faz") → o chat vira o dela → tela de escolha: "Criar minha conta grátis" (principal) ou "Ver como meu cliente vai agendar" (simulação com agendamento fictício, avisando que o link ainda não foi criado) → WhatsApp (opcional) → e-mail (com sugestão de correção) → aceite dos termos (src/content/legal.ts) → código de 6 dígitos por e-mail (Supabase Auth OTP enviado pelo nosso e-mail; validade de 10 min, 5 tentativas e 30 s entre envios controlados na tabela email_codes) → conta e negócio criados na hora. Sem senha no cadastro (dá para criar em Conta); /entrar usa código por padrão, com senha como opção. Sem login com Google ou outro provedor por enquanto. Demonstrações ficam na tabela demos por 7 dias (limpeza diária). Nicho vazio ou desconhecido de um negócio cai em "Outro / Geral" via getNiche(). Uma conta tem um negócio só.

Plano único: Completo (igual em todas as marcas; decidido em 2026-10-12). Regras e preços em src/lib/plans.ts (PLAN_PRICES, PRICE_TEXT, getPlanFeatures); textos usam PRICE_TEXT, nunca valores escritos à mão.
- Completo: R$ 29,90/mês ou R$ 24,90/mês no anual. Agendamentos ilimitados, lembretes, sem a marca MeetChat, chat no site, clientes, financeiro, vendas, equipe, Google Agenda e sinal ou pagamento total pelo Pix com comprovante (DEPOSITS_ENABLED; src/lib/deposits).
- Sinal pelo Pix (2026-10-11): o cliente paga direto na chave do profissional (BR Code estático com o id do agendamento no txid) um valor com centavos únicos (1 a 99 centavos a menos; a mais só se ficar abaixo do mínimo; índice único entre pendentes do mesmo profissional), aceita a política (texto, versão e data em deposit_policy_acceptances) e envia o comprovante no chat (JPG/PNG comprimido em WebP no navegador, ou PDF, até 5 MB). Não existe "já paguei" sem arquivo. O arquivo vai por URL assinada de 5 min para receipts/<id aleatório de 128 bits>.<ext> no bucket atual (nenhum id no caminho; o link público nunca é exposto: a dona vê por /painel/sinais/comprovante/[id], que lê no servidor, sem cache). O servidor lê o arquivo em memória (exceção aprovada à regra 7, sem gravar nem logar), confere o tipo pelos bytes e calcula o SHA-256 (único: o mesmo comprovante em outro agendamento é recusado). Status: waiting → sent (pré-confirmado, horário bloqueado) → confirmed | refused | expired; refunded registrado pela dona. Nada é lido do conteúdo (sem OCR/IA). Só a dona confirma ou recusa. Reserva de 20 min (configurável), lembretes à dona após 2 h e 6 h (configuráveis), destaque no Início, arquivos apagados 30 dias após a decisão (cron cleanup). Para o chat pedir o sinal, o negócio precisa da chave Pix (Configurações › Sinal pelo Pix) e de pelo menos um serviço com "Pagamento pelo Pix ao agendar" (Meu perfil › Serviços).
- Teste de 14 dias do Completo em todo cadastro (conversa e formulário), sem cartão, uma vez por pessoa (hashes de e-mail, telefone e CPF/CNPJ em trial_claims; quem já usou começa direto no modo de espera). Avisos por e-mail e push nos dias 10, 13 e 14 (cron trial).
- Modo de espera (fim do teste sem pagamento, assinatura cancelada após o período pago ou em atraso há mais de 5 dias): o link e o chat continuam no ar em modo WhatsApp (serviço, dia, turno e nome → wa.me com mensagem pronta; nada é gravado nem reservado), com o selo "Agende também com o MeetChat" no rodapé. O painel abre só a tela de assinatura (com "Este mês, X clientes pediram horário pelo seu link e foram para o seu WhatsApp…", contagem anônima do evento handoff_sent, sem mínimo de 5 por decisão de 2026-10-12) e a Conta; requireBusiness/requireOwner redirecionam o resto (allowWaiting nas telas de assinatura). Agenda, clientes e configurações ficam guardados; agendamentos já marcados continuam válidos; ao assinar, tudo volta na hora.
- O selo "Agende também com o MeetChat" aparece só no modo de espera (removeBranding = teste ou assinatura).
- 1 profissional incluso; cada extra R$ 9/mês (R$ 90/ano). Durante o teste, até 10 profissionais.
- Assinatura: ciclo começa na data da assinatura, sem cobrança proporcional; libera na hora ao pagar. Mudanças de ciclo ou de profissionais valem a partir da próxima cobrança. Cancelamento mantém o plano até o fim do período pago.
- No banco: businesses.plan "free" (sem assinatura: teste ou modo de espera) ou "complete" (assinante); trial_plan, signup_choice e subscriptions.pending_plan ficaram só como histórico. A migração de 2026-10-12 passou assinantes para o Completo (mesmas datas, valor novo no Asaas a partir da próxima cobrança via needs_reprice) e deu 14 dias a todas as contas sem assinatura, com um e-mail único (plan_change_notice_pending). businesses.professional_seats = profissionais pagos.
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