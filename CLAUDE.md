# Projeto: Lively — agenda e link de bio multimarcas

## Produto
Chat de agendamento + agenda + financeiro simples para qualquer negócio que trabalha com hora marcada (decidido em 2026-10-05). É um sistema só de agendamento e financeiro simples: nada específico de consultório (sem prontuário, recibo, termo, recorrência). Os recursos que já existem (ferramentas de venda, portal, pacotes, combos, cupons, sinal por Pix, avaliações, lista de espera) continuam; não criar recursos novos fora de agendamento e financeiro sem pedido.
Vendido como vários nichos (MARCAS), cada um com cores, textos e exemplos próprios, usando o MESMO sistema.
Segmentos (= nichos): beauty, barber, aesthetics, nails, lash_brow, tattoo, psychology, psychoanalysis, physio, nutrition, speech_therapy, occupational_therapy, psychopedagogy, dentistry, medical, podiatry, chiropractic, osteopathy, acupuncture, massage_therapy, integrative_therapy, pilates, yoga, personal_trainer, pet_grooming, veterinary, tutoring, photography, consulting, auto_detailing, sports_court. As chaves de marca usam hífen (lash-brow...). Nichos novos usam nicheBrand (src/brands/niche.ts: textos comuns, tipo "general" ou "health"); cada nicho tem um grupo (beleza, saúde, bem-estar, pets, serviços) para a lista do site.

Nome do produto: **Agendamo** (definido em 2026-10-04). O site tem uma página inicial genérica (/) que apresenta o sistema e vende para todos os nichos, e uma página por nicho (/beleza, /barbearia, /psicologia, /banho-e-tosa, /aulas...) com textos, cores e exemplos próprios. Os nichos são as "marcas" de src/brands (todas com nome "Agendamo"); a configuração da página inicial é src/brands/platform.ts (PLATFORM), que não é um nicho. O cadastro vindo de um nicho cria o negócio naquele nicho (/cadastro?brand=<chave>); da página inicial, /comecar pergunta o nicho antes.

Produto "chat primeiro" (confirmado em 2026-10-05, sem página do profissional): o link do negócio (/<slug>) abre direto no chat de agendamento; tocar na foto abre o perfil (estilo dados do contato); /<slug>/perfil é a versão indexável (portal e Google).

Plano único (igual em todas as marcas):
- 30 dias grátis ao criar o negócio, sem cartão, uma vez por negócio. Durante o teste, tudo liberado (até 10 profissionais).
- Depois: R$ 19/mês ou R$ 192/ano (R$ 16/mês, mostrar a economia). 1 profissional incluso; cada profissional extra R$ 9/mês (R$ 90/ano). Preços em src/lib/plans.ts (PLAN_PRICES); textos usam PRICE_TEXT, nunca valores escritos à mão. (Preços de 2026-10-05.)
- Inclui tudo: chat com horários livres e confirmação na hora, agenda, lembretes, financeiro (receitas automáticas dos atendimentos concluídos + lançamentos manuais e custos), até 60 fotos, ferramentas de venda, sinal por Pix, pacotes e combos, Google Agenda, modal para sites externos, equipe, recursos compartilhados. Sem rodapé "Feito com [marca]" para assinantes.
- Sem assinatura após o teste (ou assinatura vencida): o chat continua, mas termina abrindo o WhatsApp da dona com o pedido pronto (nada é gravado nem reservado); o painel abre só a tela de assinatura e a conta. Nada é apagado.
- No banco: plan "free" = sem assinatura (teste ou expirado), "pro" = assinante ("team" é legado e conta como "pro"); businesses.professional_seats = profissionais pagos.
- Adicionais: Destaque no portal (R$ 49/mês por cidade) e Domínio próprio.
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