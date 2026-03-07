# Resumo — Documentos Legais (Termos e Privacidade)

## Estrutura de Dados
- Tabelas:
  - `legal_documents`: `id` (uuid), `type` (`PRIVACY_POLICY` | `TERMS_OF_USE`), `content` (HTML), `is_active` (boolean), `created_at`.
  - `user_agreements`: `id` (uuid), `user_id`, `document_id`, `created_at`, único por (`user_id`, `document_id`).
- Migração: `backend/src/database/migrations/1765500000000-create-legal-documents-and-agreements.ts:6`.
- Entidades: `backend/src/modules/legal/entities/legal-document.entity.ts`, `backend/src/modules/legal/entities/user-agreement.entity.ts`.

## Endpoints
- Público:
  - `GET /api/v1/legal/active` → retorna ativos `{ privacy, terms }`.
    - Controller: `backend/src/modules/legal/legal.controller.ts:14`
    - Serviço: `backend/src/modules/legal/legal.service.ts:29`
- Admin:
  - `GET /api/v1/admin/legal/documents?type=PRIVACY_POLICY|TERMS_OF_USE` (histórico) — `backend/src/modules/legal/legal.controller.ts:29`
  - `POST /api/v1/admin/legal/documents` (cria HTML e pode ativar) — `backend/src/modules/legal/legal.controller.ts:37`
  - `PATCH /api/v1/admin/legal/documents/:id/activate` (ativa e garante único ativo por tipo) — `backend/src/modules/legal/legal.controller.ts:45`

## Lógica
- Ativação única por tipo:
  - Desativa todos de mesmo `type` e ativa o selecionado.
  - `backend/src/modules/legal/legal.service.ts:37` (activateDocument)
- Aceite do usuário:
  - Ao registrar ou criar via Google, grava aceite dos documentos ativos (evita duplicar).
  - `backend/src/modules/legal/legal.service.ts:46` (recordUserAcceptance)
- Cadastro exige aceite explícito:
  - DTO inclui `acceptedLegal` com validação booleana.
  - `backend/src/modules/auth/dto/register.dto.ts:35`
  - Verificação: `backend/src/modules/auth/auth.service.ts:58`

## Frontend
- Admin Legal:
  - Editor de HTML com pré‑visualização e histórico por tipo (aba “Todos” agrega ambos).
  - `frontend/src/app/admin/legal/page.tsx:65`
- Páginas públicas:
  - SSR de conteúdos ativos em `/privacy` e `/terms`, renderizando `content` como HTML.
  - `frontend/src/app/privacy/page.tsx:8`
  - `frontend/src/app/terms/page.tsx:8`

## Configuração
- Entidades TypeORM registradas em:
  - `backend/src/config/database.config.ts:62`, `backend/src/database/datasource.ts:64`
- Migrações:
  - `npm run migration:run:ts` (usa `src/database/datasource.ts`)

## Comportamento Esperado
- Apenas um Termos e uma Política ficam ativos simultaneamente.
- Todo novo usuário (local/Google) tem aceites vinculados às versões ativas.
- Páginas públicas apresentam imediatamente os conteúdos ativos.

