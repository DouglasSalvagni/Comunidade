# Relatório White Label — Projeto Comunidade (Ninaro)
**Data:** 2026-03-09  
**Autor:** Análise automática via Antigravity  
**Versão analisada:** Backend NestJS + Frontend Next.js

---

## 1. Visão Geral

Este documento identifica tudo que precisa ser alterado para tornar a plataforma **Comunidade** (atualmente configurada como "Ninaro") em um produto **white label** — isto é, reutilizável por diferentes clientes/marcas sem alterar o código-fonte.

A análise cobre:
- **Backend** (`/backend`) — NestJS + TypeORM + PostgreSQL
- **Frontend** (`/frontend`) — Next.js + TailwindCSS

> [!NOTE]
> **Fora do escopo:** A Landing Page (`components/inspira/*`, `components/Hero`, `components/Pricing`, `components/Benefits`, `components/Footer`, `components/Navbar`, `app/page.tsx`) **não está incluída** neste relatório. A LP é sempre um projeto separado hospedado em subdomínio próprio e não faz parte do produto white label.

---

## 2. Itens Hard-coded Identificados (Não Parametrizados)

Estes são textos, imagens e referências de marca que estão **diretamente no código** e precisam ser externalizados.

### 2.1 Frontend — Componentes do Produto (App)

> ⚠️ Componentes da Landing Page (`components/inspira/*`, `components/Hero`, `components/Pricing`, `components/Benefits`, `components/Footer`, `components/Navbar`, `app/page.tsx`) estão fora do escopo — pertencem ao projeto de LP em subdomínio.

| Arquivo | O que está hard-coded |
|---|---|
| `app/layout.tsx` | Tag `<html lang="en">` — idioma fixo; fonte `Geist`/`Geist Mono` sem abstração; sem metatags dinâmicas (`title`, `description`) |
| `app/dashboard/layout.tsx` | Eventuais referências ao nome ou logo da marca na sidebar/header do dashboard |
| `components/Sidebar.tsx` | Verificar se nome/logo da marca está hardcoded na sidebar do dashboard |

### 2.2 Frontend — Configurações

| Arquivo | O que está hard-coded |
|---|---|
| `.env.example` | `NEXT_PUBLIC_APP_NAME=Ninaro`, `NEXT_PUBLIC_APP_DESCRIPTION=Músicas e Audiobooks Infantis` |
| `tailwind.config.ts` | Paleta `brand.*` com cores fixas (`#1e1b4b`, `#5b21b6`, `#3b82f6`, `#2dd4bf`, `#fb923c`, `#facc15`) sem mecanismo de override por tenant |
| `globals.css` | Cores CSS custom properties (`--primary`, `--secondary`, etc.) hardcoded em HSL sem possibilidade de injeção por tenant |

### 2.3 Backend

| Arquivo | O que está hard-coded |
|---|---|
| `main.ts` | Título Swagger `'Little Tales API'`, descrição da API `'API para app de músicas e audiobooks infantis'` |
| `.env.example` | `APP_NAME=Ninaro` |
| `auth/mail.service.ts` | Nome `appName` vem do env (`APP_NAME`), mas template de e-mail tem cores fixas (`#4A90E2` — azul Ninaro), layout de e-mail transacional sem personalização |
| `modules/subscriptions/entities/plan.entity.ts` | Planos são armazenados no banco (✅ correto) mas sem vinculação a um `tenant_id` |

### 2.4 Assets / Imagens

| Asset | Problema |
|---|---|
| `frontend/src/assets/logo-horizontal.webp` | Logo do Ninaro importada diretamente nos componentes |
| `frontend/src/assets/logoninaro.webp` | Logo vertical do Ninaro importada diretamente |
| `frontend/src/assets/hero-image.jpg` | Imagem de hero específica do produto |
| `frontend/src/assets/fallback-audio.jpg` | Imagem de fallback de áudio |
| `frontend/public/favicon.ico` e `icon.png` | Favicon e ícone do app Ninaro |

---

## 3. O que é Personalizável (Características White Label)

### 3.1 ✅ Já funciona via Variável de Ambiente

Estes itens **já estão parametrizados ou são facilmente configuráveis** via `.env`:

| Variável | Onde é usada | Descrição |
|---|---|---|
| `APP_NAME` | `backend/.env` → `mail.service.ts` | Nome do app nos e-mails |
| `NEXT_PUBLIC_APP_NAME` | `frontend/.env` | Nome público do app no frontend |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `frontend/.env` | Descrição pública do app |
| `NEXT_PUBLIC_API_URL` | `frontend/.env` | URL da API (já desacoplado) |
| `NEXT_PUBLIC_DEFAULT_AVATAR` | `frontend/.env` | Avatar padrão dos usuários |
| `NEXT_PUBLIC_DEFAULT_COVER` | `frontend/.env` | Capa padrão de conteúdo |
| `SMTP_*` | `backend/.env` | Configurações de e-mail (já parametrizado) |
| `CORS_ORIGIN` / `FRONTEND_URL` | `backend/.env` | URLs permitidas (já parametrizado) |
| `STRIPE_*` / `ASAAS_*` | `backend/.env` | Gateways de pagamento (já parametrizado) |
| `JWT_*` | `backend/.env` | Segurança JWT (já parametrizado) |
| `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` | Ambos os `.env` | OAuth providers (já parametrizado) |
| `DATABASE_URL` / `REDIS_URL` | `backend/.env` | Infraestrutura (já parametrizado) |

### 3.2 ✅ Já Armazenável no Banco de Dados

Estes itens **já têm infraestrutura de banco**, mas precisam de exposição via API/admin:

| Entidade/Recurso | Tabela | Descrição |
|---|---|---|
| **Planos de assinatura** | `plans` | Nome, preço, período, features (JSONB), status — já no banco |
| **Cupons de desconto** | (subscriptions) | Sistema de cupons já implementado |
| **Afiliados/Parcerias** | `affiliates`, `partnerships` | Já no banco |
| **Documentos legais** | `legal_documents` | Termos de uso e Política de Privacidade já são dinâmicos no banco ✅ |
| **System Settings** | `system_settings` | Tabela genérica de chave-valor **já existe** mas **está quase vazia** — ideal para configurações white label |
| **Usuários / Perfis** | `users` | Dados do cliente já persistidos |

### 3.3 ❌ Precisa Ser Criado — Armazenável no Banco de Dados

| O que armazenar | Tabela sugerida | Descrição |
|---|---|---|
| Nome da plataforma (`platform_name`) | `system_settings` | Substituir `APP_NAME` hardcoded |
| Descrição da plataforma | `system_settings` | Tagline/subtítulo do produto |
| URL do logo principal | `system_settings` | Logo horizontal (navbar) |
| URL do logo compacto | `system_settings` | Logo quadrado/ícone |
| URL do favicon | `system_settings` | Ícone da aba |
| Cor primária (HSL) | `system_settings` | `--primary` do design system |
| Cor secundária (HSL) | `system_settings` | `--secondary` do design system |
| Cor de destaque (HSL) | `system_settings` | `--accent` |
| URL de redes sociais | `system_settings` | Instagram, Facebook, etc. (usadas no app e e-mails) |
| Fontes do design (display/body) | `system_settings` | Google Fonts configurável |
| Favicon e open graph image | `system_settings` | URLs para CDN |
| Links de download do app | `system_settings` | App Store URL, Google Play URL |
| Idioma padrão | `system_settings` | `lang` da tag `<html>` |
| Moeda (`currency_symbol`, `currency_code`) | `system_settings` | Para exibição de preços |
| Cor dos e-mails transacionais | `system_settings` | Cor do botão e cabeçalho dos e-mails |
| Suporte / e-mail de contato | `system_settings` | E-mail "fale conosco" |

### 3.4 ❌ Precisa Ser Criado — Via Variável de Ambiente

| Variável sugerida | Descrição |
|---|---|
| `TENANT_ID` ou `TENANT_SLUG` | Identificador do cliente (para multi-tenant futuro) |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Cor primária via env (alternativa ao banco para envs estáticos) |
| `NEXT_PUBLIC_LOGO_URL` | URL do logo via CDN |
| `NEXT_PUBLIC_FAVICON_URL` | URL do favicon via CDN |
| `NEXT_PUBLIC_APP_LOCALE` | Locale padrão do app (`pt-BR`, `en-US`, etc.) |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | Símbolo de moeda (`R$`, `$`, `€`) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | E-mail de suporte exibido no app |
| `APP_LOGO_URL` | Logo para uso nos e-mails transacionais (backend) |
| `APP_PRIMARY_COLOR` | Cor dos botões nos e-mails (backend) |
| `APP_SUPPORT_URL` | URL do FAQ/suporte nos e-mails |

---

## 4. Áreas que Precisam de Refatoração

### 4.1 Frontend — Arquitetura de Tema

**Problema:** As cores e tipografia são definidas em `globals.css` e `tailwind.config.ts` de forma estática. Não há mecanismo para injetar um tema dinamicamente.

**Solução recomendada:**
1. Criar um `ThemeProvider` que busca o tema via API (`/api/v1/settings/public`) ao carregar a aplicação
2. Injetar as CSS custom properties dinamicamente via `style` tag ou via `document.documentElement.style.setProperty`
3. Mover as cores `brand.*` do `tailwind.config.ts` para variáveis CSS dinâmicas

### 4.2 Frontend — Componentes do App (Dashboard)

**Problema:** Referências de marca (nome do app, logo) podem aparecer hardcoded na **Sidebar** e no **Header** do painel autenticado.

**Solução recomendada:**
1. Criar componente `<BrandLogo />` centralizado que lê a URL do logo via `NEXT_PUBLIC_LOGO_URL` (`.env`) ou do endpoint `/api/v1/settings/public`
2. Substituir textos com nome do app pelos valores de `NEXT_PUBLIC_APP_NAME` ou dado do banco
3. A sidebar e o header devem consumir o `ThemeProvider` para cor e tipografia dinâmicas

### 4.3 Frontend — Assets/Imagens

**Problema:** Logos e imagens de hero são importados diretamente como módulos estáticos.

**Solução recomendada:**
1. Mover as logos para um CDN (S3, Cloudflare R2, etc.)
2. Usar URLs dinâmicas via env vars ou banco de dados
3. Criar um componente `<BrandLogo />` que carrega a URL configurada
4. Configurar `next.config.ts` para suportar domínios externos de imagens

### 4.4 Backend — E-mails Transacionais

**Problema:** Template de e-mail (`mail.service.ts`) tem cor `#4A90E2` hard-coded e layout genérico.

**Solução recomendada:**
1. Mover a cor primária dos e-mails para `system_settings` (chave `email_primary_color`)
2. Adicionar campos dinâmicos: logo URL, nome do app (já feito parcialmente via `APP_NAME`)
3. Criar um `EmailTemplateService` que monta templates com as configurações do banco

### 4.5 Backend — `system_settings` Expandido

**Problema:** A tabela `system_settings` já existe e tem infraestrutura de `get/set`, mas não expõe uma rota pública para o frontend consumir as configurações.

**Solução recomendada:**
1. Criar endpoint público `GET /api/v1/settings/public` sem autenticação
2. Definir quais chaves são "públicas" (nome do app, cores, logo URL) vs "privadas" (configurações internas)
3. Criar endpoint admin `PUT /api/v1/admin/settings/:key` para atualizar

### 4.6 Multi-tenant (Opcional — Fase 2)

Para suportar **múltiplos clientes** em uma única instalação, seria necessário:
1. Adicionar `tenant_id` nas entidades principais
2. Middleware de resolução de tenant por domínio (`X-Tenant-ID` header ou subdomínio)
3. Tabela `tenants` com configurações por cliente
4. Row-level security no PostgreSQL por `tenant_id`

---

## 5. Infraestrutura

| Item | Status atual | Para white label |
|---|---|---|
| Docker Compose | ✅ Configurado | Adicionar variáveis de tema nos compose files |
| Swagger | ⚠️ Título hardcoded "Little Tales API" | Usar `APP_NAME` do env |
| Favicon | ❌ Fixo no repositório (`app/favicon.ico`) | Servir dinamicamente via URL configurável |
| `robots.txt` / `sitemap.xml` | ❌ Não identificado | Adicionar com nome de domínio dinâmico |
| SEO meta tags | ❌ Metadata comentada no `layout.tsx` | Implementar com dados dinâmicos do banco |

---

## 6. Resumo de Prioridades

| Prioridade | O que fazer |
|---|---|
| 🔴 Alta | Externalizar nome, logo e cores da marca (texto + assets) |
| 🔴 Alta | Criar endpoint público `/settings/public` no backend |
| 🔴 Alta | Remover referências hardcoded a "Ninaro", "KidsVerse", "Little Tales" |
| 🟡 Média | Criar `ThemeProvider` dinâmico no frontend |
| 🟡 Média | Externalizar nome/logo nos componentes do dashboard (Sidebar, Header) |
| 🟡 Média | Tornar e-mails transacionais com cores configuráveis |
| 🟡 Média | Implementar SEO meta tags dinâmicas |
| 🟢 Baixa | Painel admin para editar as configurações white label |
| 🟢 Baixa | Suporte multi-tenant completo (multi-cliente numa instalação) |
