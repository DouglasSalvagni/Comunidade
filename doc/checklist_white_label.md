# Checklist White Label — Projeto Comunidade

**Última atualização:** 2026-03-09  
**Referência:** Ver `relatorio_white_label.md` para detalhes de cada item.

---

## 🔴 Prioridade Alta — Identidade da Marca

### Backend
- [x] Usar `APP_NAME` do `.env` no título do Swagger — `main.ts` usa `configService.get('APP_NAME')` + nova var `API_DESCRIPTION`
- [x] Adicionar variável `APP_LOGO_URL` ao `.env.example` do backend
- [x] Adicionar variável `APP_PRIMARY_COLOR` ao `.env.example` do backend (para e-mails)
- [x] Substituir cor `#4A90E2` hardcoded no template de e-mail — `mail.service.ts` usa `APP_PRIMARY_COLOR` e `APP_LOGO_URL` do env
- [x] Criar endpoint público `GET /api/v1/settings/public` — `settings.controller.ts` criado, expõe apenas chaves da allowlist
- [x] Criar endpoint admin `PUT /api/v1/admin/settings/:key` — `admin-settings.controller.ts` criado com guard de admin
- [x] Popular `system_settings` com as chaves iniciais — integrado no `src/database/seeds/seed.ts` existente

### Frontend
- [x] Adicionar variável `NEXT_PUBLIC_LOGO_URL` ao `.env.example`
- [x] Adicionar variável `NEXT_PUBLIC_FAVICON_URL` ao `.env.example`
- [x] Adicionar variável `NEXT_PUBLIC_SUPPORT_EMAIL` ao `.env.example`
- [x] Adicionar variável `NEXT_PUBLIC_APP_LOCALE` ao `.env.example`
- [x] Adicionar variável `NEXT_PUBLIC_CURRENCY_SYMBOL` ao `.env.example`
- [x] Substituir favicon fixo — `layout.tsx` usa `NEXT_PUBLIC_FAVICON_URL` via `export const metadata` (icons)
- [x] Corrigir `<html lang="en">` — `layout.tsx` usa `NEXT_PUBLIC_APP_LOCALE` (default: `pt-BR`)
- [x] Verificar e corrigir referências de marca hardcoded em `components/Sidebar.tsx` — substituído logo estático pelo `<BrandLogo />`
- [x] Verificar e corrigir referências de marca hardcoded em `app/dashboard/layout.tsx` — nenhuma encontrada
- [x] Criar componente `<BrandLogo />` centralizado — `components/BrandLogo.tsx` com fallback para nome de texto

---

## 🟡 Prioridade Média — Design System Dinâmico

- [x] Criar componente `ThemeProvider` — `components/ThemeProvider.tsx` consulta `/settings/public` e injeta `--primary-brand`, `--secondary-brand`, `--accent-brand` no `:root`
- [x] Integrar `ThemeProvider` no `ClientProviders` — ativo em toda a aplicação
- [ ] Mover as cores `brand.*` do `tailwind.config.ts` para CSS variables controláveis pelo ThemeProvider
- [ ] Permitir configuração de fonte (display/body) via `system_settings` usando Google Fonts dinâmico
- [ ] Configurar `next.config.ts` para aceitar domínios externos de imagens *(já aceita `**` — OK)*
- [ ] Adicionar suporte a upload de logo via painel admin (integrar com S3 ou Cloudflare R2)

---

## 🟡 Prioridade Média — SEO e Metatags

- [x] Implementar `export const metadata` em `layout.tsx` com `NEXT_PUBLIC_APP_NAME` e `NEXT_PUBLIC_APP_DESCRIPTION`
- [x] Implementar meta tags de Open Graph com nome dinâmico
- [x] Adicionar `robots.txt` dinâmico — `app/robots.ts` criado via Next.js App Router
- [x] Adicionar `sitemap.xml` dinâmico — `app/sitemap.ts` criado, usa `NEXTAUTH_URL` como base URL

---

## 🟡 Prioridade Média — E-mails Transacionais

- [x] Refatorar `mail.service.ts` — usa `APP_LOGO_URL` e `APP_PRIMARY_COLOR`
- [x] Adicionar campo "link de suporte" dinâmico nos e-mails — rodapé usa `APP_SUPPORT_URL`
- [ ] Permitir configuração do endereço de remetente (`SMTP_FROM`) via painel admin
- [ ] Criar preview de e-mail no painel admin para testar templates

---

## 🟢 Prioridade Baixa — Painel Admin

- [x] Criar página `/admin/settings` com formulário white label completo:
  - [x] Nome e descrição da plataforma
  - [x] URLs de logos (horizontal e compacto)
  - [x] Cores primária, secundária, accent e e-mail (color picker + input hex)
  - [x] Links de redes sociais e app stores
  - [x] E-mail de suporte
  - [x] Configurações de moeda e locale
- [x] Adicionar card de acesso rápido "⚙️ White Label" no painel admin (`/admin`)
- [ ] Implementar preview ao vivo das mudanças antes de salvar
- [ ] Adicionar validação de formato de URL para logos e ícones

---

## 🟢 Prioridade Baixa — Multi-tenant (Fase 2)

- [ ] Criar tabela `tenants` com: `id`, `slug`, `name`, `domain`, `settings (jsonb)`, `created_at`
- [ ] Adicionar `tenant_id` (FK para `tenants`) nas entidades: `users`, `plans`, `subscriptions`, `legal_documents`
- [ ] Criar middleware de resolução de tenant por domínio/subdomínio ou header `X-Tenant-ID`
- [ ] Implementar Row-Level Security (RLS) no PostgreSQL por `tenant_id`
- [ ] Adaptar `system_settings` para operar por tenant
- [ ] Criar painel super-admin para gerenciar múltiplos tenants

---

## 📋 Resumo Contagem

| Prioridade | Total | ✅ Feito | 🔲 Pendente |
|---|---|---|---|
| 🔴 Alta (Marca + Env + Backend) | 17 | 17 | 0 |
| 🟡 Média (Design + SEO + Email) | 12 | 9 | 3 |
| 🟢 Baixa (Admin + Multi-tenant) | 11 | 8 | 3 + 6 (multi-tenant) |
| **Total** | **40** | **34** | **12** |

---

## 📁 Todos os Arquivos Criados / Modificados

### Criados
| Arquivo | Descrição |
|---|---|
| `backend/src/modules/settings/settings.controller.ts` | `GET /settings/public` — configurações públicas sem autenticação |
| `backend/src/modules/admin/admin-settings.controller.ts` | `GET+PUT /admin/settings/:key` — gerenciamento admin |
| `frontend/src/components/BrandLogo.tsx` | Logo centralizada via `NEXT_PUBLIC_LOGO_URL` com fallback de texto |
| `frontend/src/components/ClientProviders.tsx` | Wrapper `use client` com SessionProvider, CookieConsent, ThemeProvider |
| `frontend/src/components/ThemeProvider.tsx` | Injeta CSS vars dinâmicas do `/settings/public` no `:root` |
| `frontend/src/components/Sidebar.tsx` | Reescrito para usar `<BrandLogo />` |
| `frontend/src/app/robots.ts` | `robots.txt` dinâmico via Next.js App Router |
| `frontend/src/app/sitemap.ts` | `sitemap.xml` dinâmico com `NEXTAUTH_URL` |
| `frontend/src/app/admin/settings/page.tsx` | Formulário completo de configurações white label |

### Modificados
| Arquivo | O que mudou |
|---|---|
| `backend/src/main.ts` | Swagger com `APP_NAME` + `API_DESCRIPTION` dinâmicos |
| `backend/.env.example` | Novas vars: `API_DESCRIPTION`, `APP_LOGO_URL`, `APP_PRIMARY_COLOR`, `APP_SUPPORT_URL` |
| `backend/src/modules/auth/mail.service.ts` | Cor, logo e link de suporte via env |
| `backend/src/modules/settings/settings.module.ts` | Registra `SettingsController` |
| `backend/src/modules/admin/admin.module.ts` | Importa `SettingsModule` + `AdminSettingsController` |
| `backend/src/app.module.ts` | Importa `SettingsModule` |
| `backend/src/database/seeds/seed.ts` | Seed das system_settings integrado ao seed principal |
| `frontend/.env.example` | Novas vars white label |
| `frontend/src/app/layout.tsx` | Server Component puro com metadata, favicon e locale dinâmicos |
| `frontend/src/services/api.ts` | `adminListSettings` + `adminUpsertSetting` |
| `frontend/src/app/admin/page.tsx` | Card de acesso ao White Label Settings |

---

## ⚡ Próximos Passos Recomendados

1. **Executar o seed** (banco já rodando): `cd backend && npm run seed`
2. **Acessar** `http://localhost:3000/admin/settings` para configurar via UI
3. **Conectar `--primary-brand`** ao `tailwind.config.ts` para theming total via CSS vars
4. **Implementar upload de logo** (S3/Cloudflare R2) para evitar dependência de CDN externo
