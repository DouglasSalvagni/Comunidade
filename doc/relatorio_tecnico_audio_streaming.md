# Relatório de Escopo para Base Reutilizável

## Objetivo
Definir, com foco em refatoração orientada por IA, o que deve **ficar** e o que deve **ser removido** para transformar o projeto em uma base limpa, reaproveitável em múltiplos produtos.

## Premissas adotadas
- O escopo funcional prioritário é o que você listou.
- Tudo que for de catálogo de conteúdo, playback, playlists e mídia HLS sai da base.
- Mantemos autenticação robusta, assinatura/cobrança, compliance legal e backoffice administrativo.
- Quando uma migration mistura entidades necessárias e desnecessárias, a orientação é criar uma migration de consolidação para a base final.

## Escopo final desejado

### FICAR — Frontend

#### Área admin
- Planos (`/admin/plans`)
- Gerenciamento de Termos e Privacidade (`/admin/legal`)
- Anti-Abuso (`/admin/anti-abuse`)
- Usuários (`/admin/users`)
- Parcerias e Cupons (`/admin/partnerships`)
- Afiliados (`/admin/affiliates`)

#### Dashboard usuário
- Início (`/dashboard`)
- Meu Perfil/Conta (`/dashboard/account`)
- Assinatura (`/dashboard/subscriptions`)

#### Geral
- Login (`/auth/login`)
- Recuperação de senha (`/auth/forgot`, `/auth/reset`)
- Aceite legal obrigatório (`/auth/legal`)
- Landing page (`/`)

### REMOVER — Frontend
- Admin de catálogo e metadados de conteúdo:
  - `/admin/catalog`
  - `/admin/tags`
  - `/admin/dev-themes`
- Funcionalidades de conteúdo no dashboard:
  - `/dashboard/catalog`
  - `/dashboard/playback`
  - `/dashboard/profiles`
- Componentes e integrações de áudio/HLS:
  - `AudioPlayer`
  - `hls.js`
  - Fluxos com `__player_playTrack` e `__player_addTrack`
- APIs de frontend voltadas ao domínio de conteúdo/reprodução (métodos do `api.ts` ligados a works/tracks/playback/playlists/media de áudio).

## Backend de referência

### FICAR — Backend
- **Auth**: login, refresh, recuperação de senha, verificação de e-mail, callback OAuth existente.
- **Users**: gestão de usuários (admin e área do usuário).
- **Legal**: documentos legais e aceite de termos/política.
- **Subscriptions**:
  - planos
  - assinatura do usuário
  - checkout
  - faturas
  - cupons
  - parcerias
  - afiliados
- **Admin**:
  - anti-abuso
  - planos
  - parcerias
  - afiliados
  - configurações administrativas úteis para operação
- **Settings**: configurações sistêmicas (quando usadas por assinatura/admin).
- **Infra transversal**:
  - guards (`JwtAuthGuard`, `RolesGuard`)
  - validação global
  - auditoria (recomendado manter)

### REMOVER — Backend
- **Catalog module** (obras, tags, temas, tracks, favoritos de conteúdo).
- **Playback module** (URL de stream, eventos de reprodução, downloads offline).
- **Media module** (pipeline de upload/processamento para áudio/imagem de catálogo).
- **Playlists module**.
- **Workers de transcodificação HLS** e processamento de play-events.
- Entidades e tabelas relacionadas a conteúdo/reprodução.

## Migrations — manter vs remover

### Migrations para MANTER (diretamente úteis ao escopo)
- `1732200000000-auth-provider.ts`
- `1732200000001-user-reset-fields.ts`
- `1732200000002-user-email-verification.ts`
- `1732400000000-add-slug-to-plans.ts`
- `1732500000000-rename-and-add-period-columns.ts`
- `1732550000000-create-gateway-webhooks.ts`
- `1732560000000-create-invoices.ts`
- `1732700000000-create-gateway-metas.ts`
- `1765500000000-create-legal-documents-and-agreements.ts`
- `1766000000000-drop-all-subscriptions-checks.ts`
- `1766500000000-create-affiliates-and-partnerships.ts`
- `1767000000000-create-audit-logs.ts` (recomendado)
- `1770834300000-add-courtesy-duration-to-plans.ts`
- `1772000000000-expand-plan-billing-periods.ts`
- `1773000000000-create-system-settings.ts` (recomendado)
- `1774000000000-add-apple-user-id.ts` (se login Apple continuar)

### Migrations candidatas a REMOÇÃO (domínio de conteúdo/playback)
- `1731600000000-recommended-age-months.ts`
- `1731700000000-add-track-hls-fields.ts`
- `1731800000000-profiles-birth-year.ts`
- `1731900000000-profiles-birth-date.ts`
- `1732000000000-drop-birth-year.ts`
- `1732100000001-create-playlists.ts`
- `1732100000002-drop-favorites-unique-user-work.ts`
- `1764270799351-create-play-stats-tables.ts`
- `1764611806000-create-dev-themes.ts`
- `1764611807000-create-work-landing-samples.ts`
- `1764800000000-add-artist-name-to-works.ts`
- `1764900000000-add-cover-thumb-url-to-works.ts`
- `1771000000000-add-is-premium-to-works.ts`

### Caso especial: `1700000000000-initial-schema.ts`
- Essa migration provavelmente mistura tabelas que ficam e tabelas que saem.
- Para a base limpa, o ideal é:
  1. Criar uma migration inicial nova apenas com o domínio final (auth/users/legal/subscriptions/admin).
  2. Reaplicar apenas as migrations complementares compatíveis.
  3. Descontinuar o tronco de migrations de conteúdo/playback.

## Features importantes já existentes e recomendadas para manter na base
- Fluxo de aceite legal obrigatório antes de uso completo.
- Anti-abuso administrativo com visibilidade operacional.
- Gestão de afiliados/parcerias/cuponagem integrada à assinatura.
- Faturas e histórico financeiro para suporte e backoffice.
- Auditoria administrativa para rastreabilidade.
- Configurações sistêmicas centralizadas para evitar hardcode.
- Verificação de e-mail e recuperação de senha completas.

## Plano de execução para IA refatorar (ordem recomendada)
1. Congelar escopo e remover rotas frontend fora do objetivo.
2. Remover módulos backend de conteúdo/playback/media/playlists.
3. Limpar `AppModule` e dependências cruzadas.
4. Limpar entidades e repositórios não usados.
5. Consolidar migrations no novo baseline de banco.
6. Ajustar `api.ts` para o novo contrato mínimo.
7. Rodar lint/typecheck/testes e corrigir regressões.
8. Validar jornadas ponta a ponta:
   - login/recuperação/aceite legal
   - dashboard (início, perfil, assinatura)
   - admin (planos, legal, anti-abuso, usuários, parcerias/cupons, afiliados)

## Critérios de pronto da base
- Nenhuma rota ativa de catálogo/playback/HLS.
- Nenhuma dependência de `hls.js` ou worker de transcodificação.
- Banco sem tabelas órfãs de conteúdo/reprodução.
- Front e back compilando sem imports mortos.
- Fluxos do escopo funcionando em ambiente limpo.
