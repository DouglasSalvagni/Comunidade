# Planejamento de Features — Spaces, Feed e Interações

## 1) Entendimento do estado atual

## Arquitetura backend (NestJS + TypeORM)
- Estrutura modular por domínio: `auth`, `users`, `subscriptions`, `admin`, `legal`, `settings`, `courses`.
- Módulos registrados no root da aplicação e guardas/interceptores globais já ativos.
- Padrão de API com controllers por domínio, services com regras de negócio e entidades TypeORM + migrations.
- Controle de acesso já consolidado com `JwtAuthGuard`, `RolesGuard` e papeis `user/admin`.

## Arquitetura frontend (Next.js App Router)
- Separação clara entre áreas `/auth`, `/dashboard` e `/admin`.
- Cliente HTTP centralizado em `src/services/api.ts` (Axios + interceptors).
- Dashboard já possui sidebar e painel de membros com paginação cursor-based.
- Stack de UI já inclui shadcn/radix e Tiptap (editor rico), com componente reutilizável pronto.

## Modelagem de banco já existente
- Núcleo de usuários/assinaturas:
  - `users`, `plans`, `subscriptions`.
- Núcleo de cursos:
  - `courses`, `course_modules`, `lessons`, `lesson_progress`, `course_plan_access`, `lesson_attachments`.
- Infra de storage já pronta para upload com URL assinada (S3/R2), incluindo anexos e geração de URL de leitura/download.

## Oportunidades para reaproveitamento direto
- A lógica de controle por plano já existe via `course_plan_access` + `subscriptions`.
- O storage service já oferece base para anexos de post sem criar novo provedor.
- O frontend já possui editor rico (Tiptap) para conteúdo em HTML.
- Paginação por cursor já existe em membros e pode ser espelhada no feed.

---

## 2) Escopo funcional das novas features (MVP)

## Feature A — Espaços/Canais temáticos
- Criar espaços com nome, descrição, slug, ordem e status ativo.
- Marcar espaço como:
  - público (todos os membros autenticados),
  - restrito por plano,
  - restrito por curso.
- Permitir posts fixados por espaço.

## Feature B — Feed de postagens
- Criar post com título opcional + corpo em rich text.
- Upload de anexos em imagens e PDF.
- Listagem por espaço com:
  - posts fixados no topo,
  - ordenação por atividade recente nos demais.

## Feature C — Interações
- Curtida (toggle) em post.
- Comentários com profundidade máxima de 2 níveis:
  - `Post -> Comentário`,
  - `Comentário -> Resposta`.

---

## 3) Proposta de modelagem de banco (MVP)

## Novas tabelas

### community_spaces
- `id (uuid, pk)`
- `name (varchar, not null)`
- `slug (varchar, unique, not null)`
- `description (text, null)`
- `visibility (varchar)` valores: `public | restricted`
- `is_active (boolean, default true)`
- `sort_order (int, default 0)`
- `created_by (uuid fk users.id)`
- `created_at`, `updated_at`

### community_space_plan_access
- `id (uuid, pk)`
- `space_id (uuid fk community_spaces.id)`
- `plan_id (uuid fk plans.id)`
- unique `(space_id, plan_id)`

### community_space_course_access
- `id (uuid, pk)`
- `space_id (uuid fk community_spaces.id)`
- `course_id (uuid fk courses.id)`
- unique `(space_id, course_id)`

### community_posts
- `id (uuid, pk)`
- `space_id (uuid fk community_spaces.id, index)`
- `author_id (uuid fk users.id, index)`
- `title (varchar, null)`
- `content_html (text, not null)`
- `is_pinned (boolean, default false)`
- `pinned_at (timestamp, null)`
- `status (varchar)` valores: `published | archived`
- `comments_count (int, default 0)` (desnormalização simples)
- `likes_count (int, default 0)` (desnormalização simples)
- `created_at`, `updated_at`

### community_post_attachments
- `id (uuid, pk)`
- `post_id (uuid fk community_posts.id, index)`
- `file_key (varchar, not null)`
- `file_name (varchar, not null)`
- `content_type (varchar, not null)`
- `size_bytes (int, default 0)`
- `created_at`

### community_post_likes
- `id (uuid, pk)`
- `post_id (uuid fk community_posts.id, index)`
- `user_id (uuid fk users.id, index)`
- `created_at`
- unique `(post_id, user_id)`

### community_comments
- `id (uuid, pk)`
- `post_id (uuid fk community_posts.id, index)`
- `author_id (uuid fk users.id, index)`
- `parent_comment_id (uuid fk community_comments.id, null, index)`
- `content_html (text, not null)`
- `status (varchar)` valores: `published | deleted`
- `likes_count (int, default 0)` (opcional no MVP, manter preparado)
- `created_at`, `updated_at`

## Regras de integridade importantes
- Restringir respostas a apenas 1 nível:
  - se `parent_comment_id` existe, o comentário pai não pode ter `parent_comment_id`.
- `is_pinned` limitado por espaço:
  - opcional no MVP: máximo de N fixados por espaço (ex: 3).
- Soft delete de post/comentário recomendado para preservar histórico de discussão.

---

## 4) Regras de acesso (autorização)

## Acesso a espaço
- `public`: qualquer usuário autenticado ativo.
- `restricted`:
  - acesso se usuário tiver assinatura ativa em plano permitido do espaço, ou
  - acesso se usuário tiver acesso a curso permitido do espaço.

## Estratégia de implementação
- Criar `CommunityAccessService` para centralizar:
  - `canReadSpace(userId, spaceId)`,
  - `canPostInSpace(userId, spaceId)`,
  - `canModerateSpace(user, spaceId)`.
- Reaproveitar padrão já usado em `courses.service.ts` para validar assinatura ativa.

---

## 5) Proposta de APIs (backend)

## Admin
- `POST /admin/community/spaces`
- `GET /admin/community/spaces`
- `PATCH /admin/community/spaces/:id`
- `DELETE /admin/community/spaces/:id`
- `PUT /admin/community/spaces/:id/access/plans`
- `PUT /admin/community/spaces/:id/access/courses`
- `POST /admin/community/posts/:postId/pin`
- `POST /admin/community/posts/:postId/unpin`

## Membro (dashboard)
- `GET /community/spaces` (somente espaços acessíveis)
- `GET /community/spaces/:spaceId/feed?cursor=...&limit=...`
- `POST /community/spaces/:spaceId/posts`
- `GET /community/posts/:postId`
- `POST /community/posts/:postId/attachments/upload-url`
- `POST /community/posts/:postId/attachments`
- `POST /community/posts/:postId/like` (toggle)
- `POST /community/posts/:postId/comments`
- `POST /community/comments/:commentId/replies`
- `GET /community/posts/:postId/comments?cursor=...&limit=...`

## Contratos e padronização
- Manter envelope de resposta atual `{ data, meta }`.
- Paginação cursor-based no feed e comentários.
- Limitar upload para `image/*` e `application/pdf`.

---

## 6) Proposta de UI/UX (frontend)

## Área admin
- Nova seção `/admin/community` com:
  - lista de espaços,
  - formulário de criação/edição,
  - configuração de acesso por plano/curso,
  - moderação e fixação de posts.

## Área dashboard
- Nova seção `/dashboard/community`:
  - canais disponíveis com acesso rápido no sidebar já existente do dashboard,
  - organização elegante no sidebar com agrupamento por contexto (geral, cursos e premium),
  - destaque visual para canal ativo e indicador discreto de posts fixados,
  - feed do espaço selecionado,
  - composer com RichTextEditor (RichText já é usado no projeto, portanto aproveitar lib),
  - lista de posts fixados no topo do feed do canal.
- Tela de post:
  - detalhes,
  - comentários + respostas (máx. 2 níveis),
  - ação de curtir.

## Componentes reutilizáveis
- Reusar `RichTextEditor` para posts e comentários ricos.
- Reusar padrão visual atual da sidebar do dashboard para integrar os canais sem quebrar consistência.
- Reusar `api.ts` com novos tipos `CommunitySpace`, `CommunityPost`, `CommunityComment`.

---

## 7) Estratégia de storage para anexos

## Padrão proposto
- Reaproveitar o mesmo `StorageService`.
- Criar métodos para comunidade:
  - `generateCommunityAttachmentUploadUrl`,
  - `generateCommunityAttachmentDownloadUrl`.
- Prefixo de chave sugerido:
  - `community/posts/{postId}/{uuid}-{safeFileName}`.
- Bucket:
  - usar bucket dedicado para comunidade quando configurado (`S3_COMMUNITY_BUCKET`);
  - fallback para `S3_BUCKET` se não definido.

## Validações
- Tipos permitidos: imagem e PDF.
- Limite de tamanho por arquivo (definir no backend, ex: 10MB no MVP).
- Sanitização de nome de arquivo no backend.

---

## 8) Plano de execução incremental

## Fase 1 — Banco e backend base
1. Criar entities + migration das tabelas de comunidade.
2. Criar módulo `community` (module, service, controllers).
3. Implementar `CommunityAccessService` com validação de acesso por plano/curso.
4. Implementar CRUD de espaços (admin) e listagem de espaços acessíveis (membro).

### Checklist da execução (Fase 1)
- [x] Entities e migration das tabelas de comunidade implementadas no backend.
- [x] Módulo `community` criado com controllers e services base.
- [x] `CommunityAccessService` implementado com regras de plano/curso.
- [x] CRUD admin de espaços e listagem de espaços acessíveis para membro implementados.

## Fase 2 — Feed e anexos
1. Implementar criação/listagem de posts por espaço.
2. Implementar fixação de post por admin.
3. Integrar upload de anexos via URL assinada + persistência dos metadados.

### Checklist da execução (Fase 2)
- [x] Endpoints de criação e listagem de posts por espaço implementados.
- [x] Endpoints de fixar e desfixar posts no admin implementados.
- [x] Upload URL de anexos e persistência de metadados implementados.

## Fase 3 — Interações
1. Implementar curtidas em post (toggle + contador).
2. Implementar comentários e respostas (limite de profundidade).
3. Implementar paginação cursor-based para comentários.

### Checklist da execução (Fase 3)
- [x] Endpoint de curtida com toggle e atualização de contador implementado.
- [x] Endpoint de comentário e resposta com limite de profundidade implementado.
- [x] Endpoint de listagem de comentários com paginação cursor-based implementado.

## Fase 4 — Frontend
1. Adicionar rotas e navegação admin/dashboard para comunidade com canais integrados ao sidebar.
2. Criar telas de espaços/feed/post.
3. Integrar composer com editor rico e upload de anexos.
4. Integrar curtidas, comentários e respostas.

## Fase 5 — Qualidade e rollout
1. Testes unitários backend (acesso, validações, regras de profundidade).
2. Testes de integração das rotas principais.
3. Lint e typecheck backend/frontend.
4. Rollout com feature flag (`community_enabled`) em `system_settings`.

---

## 9) Riscos e decisões de MVP

## Riscos
- Complexidade de permissão combinando plano + curso pode gerar edge cases.
- Feed sem paginação cursor pode degradar rapidamente em volume alto.
- Rich text sem sanitização aumenta risco de XSS.

## Decisões recomendadas para reduzir risco
- Sanitizar HTML no backend antes de persistir/renderizar.
- Adotar cursor-based desde o início no feed e comentários.
- Limitar anexos por post no MVP (ex: até 4 arquivos).
- Não implementar notificação em tempo real nesta fase.

---

## 10) Critérios de pronto (MVP)

- Admin cria e gerencia espaços com regras de acesso.
- Usuário vê apenas espaços autorizados.
- Usuário cria post com rich text e anexo (imagem/PDF).
- Posts fixados aparecem no topo do espaço.
- Usuário curte/descurte posts.
- Usuário comenta e responde com profundidade máxima de 2 níveis.
- Lint e typecheck passam em backend e frontend.
- Migrações sobem em ambiente limpo.
