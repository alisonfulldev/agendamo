# Perfis públicos, diretório e privacidade (Fase 5, 2026-10-16)

## O que é público e onde

| Página              | URL                 | Indexação                                                                                                                   |
| ------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Chat de agendamento | `/<slug>`           | Canonical aponta para o perfil.                                                                                             |
| Perfil              | `/<slug>/perfil`    | `index, follow` só quando `isIndexable` (abaixo); senão `noindex, follow`.                                                  |
| Diretório do nicho  | `/<nicho>/<cidade>` | Indexável a partir de 3 perfis elegíveis (`DIRECTORY_CONFIG.minIndexable`); com 1 ou 2, `noindex, follow`; sem perfis, 404. |
| Portal (busca)      | `/explorar/...`     | Regras antigas (rule 12); fica como busca.                                                                                  |

O perfil é renderizado no servidor e mostra só o que a dona preencheu: nome, descrição, serviços (com preço só se "mostrar preços" estiver ligado), duração, fotos, endereço e bairro (opcionais), Instagram e links que ela cadastrou, e avaliações que ela não ocultou.

## Regra de indexação do perfil

`isIndexable(profile)` em `src/lib/public/indexable.ts` (testada):

- foto de perfil;
- descrição com pelo menos 30 caracteres;
- cidade preenchida;
- pelo menos 3 serviços ativos com preço;
- a dona **não** ligou "Não aparecer nas buscas".

Os mesmos números estão na função do banco `complete_businesses`, que alimenta o sitemap e o diretório. A página e o sitemap concordam sempre.

Perfis do nicho "Outro / Geral" seguem a mesma regra (não têm diretório).

## Opção de sair das buscas (LGPD)

Configurações › "Não aparecer nas buscas" (`businesses.portal_opt_out`):

- o perfil passa a sair com `noindex` na hora (o valor é lido sem cache em cada visita);
- sai do sitemap, do portal e do diretório (até 10 minutos de cache);
- o link continua funcionando para quem já o tem.

## Negócio suspenso ou excluído

- Suspenso: redirect temporário (307) para a página do nicho, porque a suspensão pode ser revertida.
- Excluído ou link que nunca existiu: 404 de verdade (não guardamos dados de conta excluída).

## Canal de remoção

Todo perfil tem "Denunciar este perfil", que abre um e-mail para o contato (`NEXT_PUBLIC_CONTACT_EMAIL`) com o endereço do perfil. Nomes que imitam a plataforma ("MeetChat" e variações) são recusados no cadastro e nas configurações, e os slugs `meetchat` e `meet-chat` são reservados.

## Diretório

- Construído só a partir de perfis completos e que aceitam aparecer nas buscas, do nicho e da cidade.
- Ordem alfabética, sem ranking pago.
- Faixa de preço só quando a dona mostra preços.
- Bairro (`/<nicho>/<cidade>/<bairro>`) fica para quando a cidade mostrar tração (D4).
- Nomes de tema (`reduzir-faltas`, `agendar-pelo-whatsapp`, `agendar-pelo-instagram`) têm prioridade sobre cidades na mesma posição da URL.

## Selo

"Agende também com o MeetChat" continua só no modo grátis (quem paga tem "sem a marca MeetChat"). A segunda linha do selo traz o nicho ("Agenda online para barbearia") e o link leva à página do nicho.
