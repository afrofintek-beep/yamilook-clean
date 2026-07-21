# Afroloc como objeto descobrível — Catálogo & Publicidade local

> **Estado:** documento de visão/arquitetura (rascunho para decisão).
> **Âmbito:** define *onde vive* o dado, *como* as apps do ecossistema o partilham e
> *como* a publicidade se encaixa. Ainda não implementa nada.
> **Contexto:** ideia do dono — usar cada endereço **Afroloc** como ponto de catálogo
> local (atrativos + serviços/produtos com preço à volta de um ingresso) e vender
> visibilidade em pacotes diário/semanal/mensal.

---

## 1. A ideia numa frase

O endereço **Afroloc** deixa de ser apenas um *código de localização* e passa a ser um
**objeto descobrível**: um ponto ao qual está agarrado conteúdo — atrativos à volta,
serviços e produtos com preço. A **Yamioo**, como *motor de descoberta de África*, é a
superfície que faz emergir esse conteúdo; a Yamilook e outras apps do ecossistema
**consomem a mesma verdade**. A publicidade (pacotes diário/semanal/mensal) é uma
**camada de destaque por cima**, não a origem do conteúdo.

## 2. O princípio arquitetónico central

**O Afroloc é uma primitiva partilhada de todo o ecossistema Afrofintek, não uma
feature de uma app.**

Isto já está provado no código: o codec Afroloc é *determinístico e idêntico* entre a
Yamioo e este repositório — o **mesmo lugar gera o mesmo código em toda a parte**
(ver `supabase/migrations/20260710110000_afroloc_nomenclature.sql`, função
`public.afroloc_nom`, e a nota "algoritmo idêntico ao do Yamioo").

Consequência direta e que decide o desenho:

- O **catálogo de um lugar** (atrativos, serviços, produtos, preços) **não deve viver
  dentro das tabelas de publicidade de uma app**. Deve viver **ao nível do endereço
  Afroloc**, como dado canónico partilhado, para que Yamioo, Yamilook e qualquer outra
  app leiam *a mesma verdade* sobre aquele ponto.
- A **publicidade** é uma camada *por cima* dessa verdade: controla **visibilidade e
  destaque**, não a *existência* do conteúdo.
- A **certificação Afroloc** é a **porta**: quem controla o ponto (endereço certificado)
  pode editar o catálogo dele. Já existe: `profiles.afroloc_certification_status`
  (`none | pending | certified | rejected`) em
  `supabase/migrations/20260703160000_afroloc_certification.sql`.

## 3. O que já existe (reaproveitar, não reinventar)

| Peça | Onde | Papel nesta ideia |
| --- | --- | --- |
| **Codec Afroloc** (`afroloc_nom`, `afroloc_b36zz`) | `migrations/…_afroloc_nomenclature.sql` | Identidade do ponto — a chave partilhada |
| **Certificação de endereço** | `migrations/…_afroloc_certification.sql`, `features/kumbu/.../useAfrolocCertification.ts` | Porta de quem pode publicar catálogo |
| **Países/divisões pan-africanas** | `afroloc_countries`, `administrative_divisions` | Nomenclatura por país (54) |
| **Privacidade geo** (`snapToGrid`, ~10 m) | `src/lib/geo-privacy.ts` | Garante que só circula a célula, nunca a posição exata |
| **Módulo de publicidade** | `src/components/advertising/*`, `src/hooks/useAdvertising.tsx` | `business_profile`, `location_markets`, `advertisements`, créditos, orçamento diário |
| **Moeda** | `CurrencySelector.tsx` | Preços do catálogo em multi-moeda |

Ou seja: **a ideia liga dois sistemas que já tens** — endereço Afroloc + publicidade
local — num objeto novo e partilhado.

## 4. Modelo de dados proposto

Uma nova entidade canónica, **ancorada no endereço Afroloc** e independente de qualquer app.

```
afroloc_place                      -- o "ponto" descobrível (1 por endereço Afroloc comercial)
  id                uuid pk
  afroloc_code      text            -- chave partilhada (a identidade do lugar)
  owner_user_id     uuid            -- dono do endereço certificado
  kind              text            -- 'attraction' | 'service' | 'product' | 'business'
  name              text
  description       text
  cover_url         text
  cell_lat/lng      double          -- SEMPRE via snapToGrid (nunca posição exata)
  status            text            -- 'draft' | 'published' | 'suspended'
  created_at / updated_at

afroloc_catalog_item               -- itens com preço dentro de um ponto
  id                uuid pk
  place_id          uuid fk -> afroloc_place
  title             text
  description       text
  price             numeric
  currency          text            -- reutiliza CurrencySelector
  media_url         text
  valid_until       timestamptz     -- expira com o pacote (preço nunca "eterno")
  is_active         boolean

afroloc_ad_package                  -- camada de destaque (por cima do catálogo)
  id                uuid pk
  place_id          uuid fk -> afroloc_place
  tier              text            -- 'daily' | 'weekly' | 'monthly'
  starts_at / ends_at timestamptz
  advertisement_id  uuid fk -> advertisements   -- liga ao módulo de créditos existente
  status            text
```

**Regras de integridade (as importantes):**

- `afroloc_place.owner_user_id` só pode publicar se
  `profiles.afroloc_certification_status = 'certified'` para aquele endereço → RLS.
- `cell_lat/lng` são **sempre** o centróide de `snapToGrid` — nunca coordenada crua.
- Um `afroloc_catalog_item` sem `valid_until` no futuro **não** aparece na descoberta
  (preços caducam → menos reclamações por preço desatualizado).
- `afroloc_ad_package` **não cria conteúdo**; só eleva a visibilidade de um `place` que
  já existe e está `published`.

## 5. Uma fonte, duas (ou mais) superfícies

O mesmo `afroloc_place` serve superfícies diferentes sem duplicar lógica:

1. **Página HTML pública** — `/loc/<AFROLOC_CODE>` — boa para SEO e partilha ("o link
   deste lugar"). Renderiza catálogo + o que há à volta (raio de vizinhança).
2. **Vista in-app** — reutiliza componentes como `LocalBusinessSection` /
   `FeaturedBusinessCard` já existentes.
3. **Yamioo (motor de descoberta)** — consome a mesma API/tabela para responder
   *"o que existe à volta deste ingresso Afroloc?"*.

Regra de ouro: **uma API de leitura, N superfícies**. A lógica de "o que há à volta"
(consulta por proximidade de célula) vive num só sítio (SQL/edge function), não em cada app.

## 6. Pacotes de publicidade (diário / semanal / mensal)

Mapeiam-se diretamente ao módulo existente — `advertisements` já tem `daily_budget`,
`total_budget`, `starts_at`, `ends_at`, créditos e transações. O `tier` do
`afroloc_ad_package` é só uma pré-configuração de duração + preço:

| Tier | Duração | Efeito |
| --- | --- | --- |
| `daily` | 1 dia | Destaque do ponto na descoberta local por 24h |
| `weekly` | 7 dias | + posição em listas de vizinhança |
| `monthly` | 30 dias | + presença destacada na página pública do lugar |

A expiração do pacote **arrasta** a validade das ofertas em destaque (coerência de preço).

## 7. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| **Privacidade** — catálogo público não pode revelar a morada de uma pessoa | Só pontos *comerciais declarados* viram `afroloc_place`; nunca a residência de um utilizador comum. `snapToGrid` sempre. |
| **Densidade** — endereços vazios matam a descoberta | Estratégia de *seed* de POIs no arranque (curadoria admin) antes de abrir auto-publicação. |
| **Preços desatualizados** | `valid_until` obrigatório; ofertas caducam com o pacote. |
| **Silos entre apps** | Dado canónico ao nível do endereço Afroloc, não das tabelas de uma app. |
| **Abuso/spam** | Certificação como porta + moderação (`status = suspended`). |

## 8. Fases sugeridas

- **Fase 0 — Alinhar visão** (este documento). Confirmar com a Yamioo *onde* vive o dado.
- **Fase 1 — Dado canónico.** Tabelas `afroloc_place` + `afroloc_catalog_item` + RLS por
  certificação. Sem UI de publicidade ainda.
- **Fase 2 — Descoberta.** Consulta "o que há à volta deste código" + página pública
  `/loc/<code>` + vista in-app.
- **Fase 3 — Publicidade.** `afroloc_ad_package` ligado ao módulo de créditos existente;
  pacotes diário/semanal/mensal.
- **Fase 4 — Seed & abertura.** Curadoria de POIs para densidade; depois auto-publicação
  para endereços certificados.

## 9. Perguntas em aberto (para decidir)

1. **Onde é a fonte da verdade?** Este dado deve viver no backend da **Yamioo** (e a
   Yamilook consome via API), ou é partilhado por uma base comum do ecossistema? — isto
   decide se implementamos aqui ou na Yamioo.
2. **Quem publica no arranque?** Só endereços certificados, qualquer `business_profile`,
   ou curadoria admin primeiro?
3. **Preço dos pacotes** diário/semanal/mensal — em créditos existentes ou tabela nova?
4. **Raio de "à volta"** — fixo (ex.: célula + N vizinhas) ou configurável por lugar?

---

*Nota: a www.yamioo.com está fechada a leitura automática (HTTP 403), pelo que este
documento assenta no que está no código deste repositório e na visão descrita pelo dono.
Assim que houver acesso ao repositório/definições da Yamioo, a secção 9.1 fica resolvida.*
