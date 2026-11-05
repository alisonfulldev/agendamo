# Fotos dos sites de exemplo (/exemplo/<ramo>)

Uma foto por ramo, só nos sites de exemplo da venda pelo WhatsApp (no lugar da foto que a dona escolhe no site dela). Arquivos em `public/examples/<chave-do-ramo>.webp` (900x1125, WebP).

Origem: [Pexels](https://www.pexels.com/license/), licença gratuita para uso comercial, sem obrigação de crédito. Número da foto no Pexels (`pexels.com/photo/<id>`), baixadas em 2026-11-06:

| Ramo | Pexels | Ramo | Pexels |
|---|---|---|---|
| acupuncture | 6076122 | nutrition | 15319038 |
| aesthetics | 3985329 | occupational-therapy | 30483047 |
| auto-detailing | 5233259 | osteopathy | 4506107 |
| barber | 2076930 | personal-trainer | 6456303 |
| beauty | 3993311 | pet-grooming | 6131147 |
| chiropractic | 4506113 | photography | 15935628 |
| consulting | 7176245 | physio | 5793918 |
| dentistry | 5355715 | pilates | 25599825 |
| integrative-therapy | 6998265 | podiatry | 5619447 |
| lash-brow | 5128220 | psychoanalysis | 5336965 |
| massage-therapy | 4599377 | psychology | 14797769 |
| medical | 7579831 | psychopedagogy | 4173118 |
| nails | 14267564 | speech-therapy | 7447266 |
| sports-court | 33641987 | tattoo | 5088482 |
| tutoring | 5311406 | veterinary | 7470754 |
| yoga | 3822169 | | |

## Galeria ("Nossos trabalhos") dos exemplos

De 4 a 6 fotos por ramo em `public/examples/gallery/<chave>-<n>.webp` (700x700, WebP), também do Pexels (mesma licença), baixadas em 2026-11-06 a partir das buscas de cada ramo. A quantidade por ramo está em `EXAMPLE_GALLERY` (`src/content/site-examples.ts`). Foram descartadas as que mostravam marca ou nome de outro estabelecimento.
