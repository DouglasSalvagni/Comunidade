# Documentos Legais — Visão Rápida

## Tabelas
- `legal_documents`
  - Campos: `id` (uuid), `type` (`PRIVACY_POLICY` | `TERMS_OF_USE`), `content` (HTML), `is_active` (boolean), `created_at` (timestamp).
  - Regra: apenas um documento ativo por `type` simultaneamente.
  - Código: `backend/src/modules/legal/entities/legal-document.entity.ts:11`.

- `user_agreements`
  - Campos: `id` (uuid), `user_id` (uuid), `document_id` (uuid), `created_at` (timestamp).
  - Regra: um registro por par (`user_id`, `document_id`). Representa aceite daquela versão do documento.
  - Código: `backend/src/modules/legal/entities/user-agreement.entity.ts:10`.

- Migração: `backend/src/database/migrations/1765500000000-create-legal-documents-and-agreements.ts:6`.

## Endpoints
- Público
  - `GET /legal/active` → retorna documentos ativos `{ privacy, terms }`.
    - `backend/src/modules/legal/legal.controller.ts:14`.

- Autenticado
  - `POST /legal/accept` → grava aceite do usuário para os documentos ativos.
    - `backend/src/modules/legal/legal.controller.ts:21`.

## Regras de Negócio
- Ativação exclusiva por tipo
  - Ao ativar um documento, desativa os demais do mesmo `type` e ativa o selecionado.
  - `backend/src/modules/legal/legal.service.ts:37`.

- Aceite por versão
  - O aceite é vinculado ao `document_id` ativo no momento do aceite. Se um novo documento for ativado, o usuário volta a ficar “não aceito” para o tipo.
  - Verificação do aceite atual: `backend/src/modules/legal/legal.service.ts:58`.

- Primeiro acesso vs Renovação
  - Primeiro acesso: exige aceite obrigatório antes de usar (bloqueio).
  - Renovação: permite continuar sem aceitar, mas exibe lembrete a cada login.
  - Cálculo “já aceitou alguma versão requerida”: `backend/src/modules/legal/legal.service.ts:69` (`hasUserAcceptedRequiredEver`).

- Quem precisa aceitar
  - Usuários comuns (local ou Google). Admin não é bloqueado.
  - Fluxo de cadastro local exige campo `acceptedLegal` verdadeiro.
    - DTO: `backend/src/modules/auth/dto/register.dto.ts:35`.
    - Serviço: `backend/src/modules/auth/auth.service.ts:59`.
  - Fluxo Google (login social) não tem checkbox na criação: o aceite é solicitado via tela pós‑login.

- Estado no objeto `user`
  - `acceptedLegal`: aceitou os documentos ativos.
  - `hasAcceptedAnyRequired`: já aceitou alguma versão de cada tipo requerido (diferencia obrigatoriedade vs renovação).
  - Popular em respostas de auth/perfil:
    - Login: `backend/src/modules/auth/auth.service.ts:51`.
    - Google: `backend/src/modules/auth/auth.service.ts:189`.
    - Perfil: `backend/src/modules/auth/auth.service.ts:141`.

## Comportamento de Frontends (resumo)
- Mobile (Expo)
  - Cadastro: checkbox obrigatório com links para leitura.
  - Login/Google: aceite via tela pós‑login (não há checkbox). Se for renovação, botão “Continuar sem aceitar”.

- Web (Next.js)
  - Middleware intercepta `dashboard`: bloqueia no primeiro acesso, libera na renovação.
  - Página `/auth/legal`: texto muda para “Novos Termos e Política” na renovação. No login Google, o aceite acontece nesta página (sem checkbox pré‑criação).
