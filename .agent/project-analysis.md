# Análise Completa do Projeto Little Tales

## 📋 Visão Geral

Este é um sistema completo de **plataforma de músicas e audiobooks infantis** chamado **Little Tales**, composto por três aplicações interligadas:

1. **Backend** (NestJS + PostgreSQL + Redis)
2. **Frontend** (Next.js 16 + React 19)
3. **Mobile** (React Native + Expo)

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Comunicação

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │◄────────┤   Backend API   │
│   (Next.js)     │  HTTP   │   (NestJS)      │
│   Port: 3000    │         │   Port: 3003    │
└─────────────────┘         └────────┬────────┘
                                     │
┌─────────────────┐                  │
│   Mobile App    │◄─────────────────┤
│   (Expo)        │  HTTP/ngrok      │
│   Tunnel        │                  │
└─────────────────┘                  │
                            ┌────────┴────────┐
                            │                 │
                     ┌──────▼──────┐   ┌─────▼─────┐
                     │  PostgreSQL │   │   Redis   │
                     │  Port: 5433 │   │ Port:6380 │
                     └─────────────┘   └───────────┘
```

---

## 🔧 Backend (NestJS)

### Tecnologias Principais
- **Framework**: NestJS 10.3
- **Banco de Dados**: PostgreSQL (TypeORM 0.3.17)
- **Cache/Queue**: Redis + Bull Queue
- **Autenticação**: JWT + Passport (local + Google OAuth)
- **Upload**: Multer + R2 S3
- **Documentação**: Swagger
- **Email**: Nodemailer

### Estrutura de Módulos

```
backend/src/modules/
├── auth/              # Autenticação e autorização
├── users/             # Gerenciamento de usuários
├── profiles/          # Perfis infantis (multi-perfil)
├── catalog/           # Obras (músicas, audiobooks, séries)
├── playback/          # Reprodução e streaming
├── playlists/         # Playlists personalizadas
├── subscriptions/     # Planos e assinaturas
├── admin/             # Painel administrativo
└── media/             # Upload e processamento de mídia
```

### Entidades Principais

#### 1. **User** (Usuário)
```typescript
{
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  authProvider: 'local' | 'google'
  emailVerified: boolean
  resetPasswordToken?: string
  emailVerificationToken?: string
}
```

#### 2. **Profile** (Perfil Infantil)
```typescript
{
  id: string
  userId: string
  name: string
  avatarUrl?: string
  birthDate?: string
  parentalPin?: string  // PIN para controle parental
  isActive: boolean
}
```

#### 3. **Work** (Obra)
```typescript
{
  id: string
  title: string
  description?: string
  type: 'music' | 'audiobook' | 'series'
  recommendedMinMonths?: number
  recommendedMaxMonths?: number
  coverUrl?: string
  duration?: number
  isActive: boolean
  tags: Tag[]
  tracks: Track[]
}
```

#### 4. **Track** (Faixa/Episódio)
```typescript
{
  id: string
  workId: string
  title: string
  audioUrl?: string
  storageKey?: string
  duration?: number
  orderIndex: number
  // Campos HLS para streaming adaptativo
  hlsPlaylistUrl?: string
  hlsProcessed?: boolean
}
```

#### 5. **Playlist**
```typescript
{
  id: string
  userId: string
  profileId?: string
  name: string
  isDefault: boolean  // Playlist padrão do perfil
  items: PlaylistItem[]
}
```

#### 6. **Subscription** (Assinatura)
```typescript
{
  id: string
  userId: string
  planId: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  currentPeriodEnd?: string
  provider?: string
  providerSubscriptionId?: string
}
```

### Endpoints Principais

#### Autenticação (`/api/v1/auth`)
- `POST /register` - Registro de usuário
- `POST /login` - Login local
- `POST /oauth/google` - Login com Google
- `POST /refresh` - Refresh token
- `GET /profile` - Perfil do usuário autenticado
- `PATCH /profile` - Atualizar perfil
- `PATCH /profile/password` - Trocar senha
- `POST /password/forgot` - Solicitar reset de senha
- `POST /password/reset` - Resetar senha
- `POST /email/verify/request` - Solicitar verificação de email
- `POST /email/verify` - Verificar email

#### Perfis (`/api/v1/profiles`)
- `GET /` - Listar perfis do usuário
- `POST /` - Criar novo perfil
- `PATCH /:id` - Atualizar perfil
- `DELETE /:id` - Deletar perfil

#### Catálogo (`/api/v1/works`)
- `GET /` - Listar obras (com filtros)
- `GET /:id` - Detalhes de uma obra
- `POST /:id/favorite` - Favoritar/desfavoritar

#### Playback (`/api/v1/playback`)
- `GET /:trackId/url` - URL de streaming da faixa
- `POST /:trackId/play` - Registrar evento de reprodução

#### Playlists (`/api/v1/playlists`)
- `GET /` - Listar playlists
- `POST /` - Criar playlist
- `GET /:id/items` - Itens da playlist
- `POST /:id/items` - Adicionar item
- `DELETE /:id/items/:itemId` - Remover item

### Configuração de Ambiente

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/little_tales

# Redis
REDIS_URL=redis://localhost:6380
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=little-tales-secret-key
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Migrations

O projeto usa TypeORM migrations para versionamento do banco:

```
migrations/
├── 1731600000000-recommended-age-months.ts
├── 1731700000000-add-track-hls-fields.ts
├── 1731800000000-profiles-birth-year.ts
├── 1731900000000-profiles-birth-date.ts
├── 1732000000000-drop-birth-year.ts
├── 1732100000001-create-playlists.ts
├── 1732100000002-drop-favorites-unique-user-work.ts
├── 1732200000000-auth-provider.ts
├── 1732200000001-user-reset-fields.ts
└── 1732200000002-user-email-verification.ts
```

---

## 🎨 Frontend (Next.js)

### Tecnologias Principais
- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.2.0
- **Styling**: TailwindCSS 3.4.18
- **UI Components**: Radix UI
- **Autenticação**: NextAuth 4.24.13
- **State Management**: TanStack Query 5.90.8
- **Forms**: React Hook Form + Zod
- **Animações**: Framer Motion 12.23.24
- **Player**: HLS.js 1.6.14 (streaming adaptativo)

### Estrutura de Diretórios

```
frontend/src/
├── app/                    # App Router (Next.js 13+)
│   ├── admin/             # Painel administrativo
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard do usuário
│   ├── login/             # Login
│   ├── api/               # API Routes
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Landing page
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base (Radix UI)
│   └── inspira/          # Componentes da landing page
├── context/              # Context API
│   └── PlayerHeightContext.tsx
├── hooks/                # Custom hooks
├── lib/                  # Utilitários
│   ├── utils.ts
│   ├── auth.ts
│   └── api-client.ts
└── services/             # Serviços de API
    └── api.ts
```

### Páginas Principais

#### Landing Page (`/`)
- Navbar com logo e navegação
- Hero section
- Features (recursos do app)
- Audio Preview
- Pricing (planos)
- Footer

#### Autenticação
- `/login` - Login
- `/auth/register` - Registro
- `/auth/verify-email` - Verificação de email
- `/auth/forgot-password` - Recuperação de senha

#### Dashboard (`/dashboard`)
- Seleção de perfis
- Catálogo de obras
- Player de áudio/vídeo
- Playlists
- Favoritos

#### Admin (`/admin`)
- Gerenciamento de obras
- Gerenciamento de usuários
- Upload de mídia
- Estatísticas

### Serviço de API

O frontend usa uma classe `ApiService` centralizada:

```typescript
class ApiService {
  // Autenticação
  login(email, password)
  loginWithGoogle(idToken)
  register(name, email, password)
  refreshToken(refreshToken)
  getProfile()
  
  // Perfis
  getProfiles()
  createProfile(data)
  updateProfile(id, data)
  deleteProfile(id)
  
  // Catálogo
  getWorks(filters)
  getWork(id)
  toggleFavorite(workId, profileId)
  
  // Playback
  getStreamingUrl(trackId)
  recordPlayEvent(trackId, profileId)
  
  // Playlists
  getPlaylists(profileId)
  createPlaylist(name, profileId)
  addToPlaylist(playlistId, trackId)
  removeFromPlaylist(playlistId, itemId)
}
```

### Configuração de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 📱 Mobile (React Native + Expo)

### Tecnologias Principais
- **Framework**: Expo ~54.0.25
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Áudio/Vídeo**: expo-av, expo-video
- **Autenticação**: expo-auth-session (Google OAuth)
- **TypeScript**: 5.9.2

### Estrutura de Diretórios

```
mobile/src/
├── components/           # Componentes reutilizáveis
│   ├── AudioPlayer.tsx
│   ├── WorkCard.tsx
│   ├── ProfileCard.tsx
│   └── ...
├── context/             # Context API
│   ├── AuthContext.tsx
│   └── PlayerContext.tsx
├── screens/             # Telas do app
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── VerifyEmailScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   ├── VerificationNoticeScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ProfilesScreen.tsx
│   ├── CatalogScreen.tsx
│   ├── AccountScreen.tsx
│   └── ResetPasswordScreen.tsx
└── services/            # Serviços
    └── api.ts
```

### Fluxo de Navegação

```
App.tsx
  └─ SafeAreaProvider
      └─ AuthProvider
          └─ PlayerProvider
              └─ Screens (navegação condicional)
                  ├─ LoginScreen
                  ├─ RegisterScreen
                  ├─ VerifyEmailScreen
                  ├─ VerificationNoticeScreen
                  ├─ ForgotPasswordScreen
                  └─ HomeScreen (autenticado)
                      ├─ ProfilesScreen
                      ├─ CatalogScreen
                      └─ AccountScreen
```

### Context API

#### AuthContext
```typescript
{
  user: AuthUser | null
  accessToken: string | null
  activeProfileId: string | null
  login(email, password)
  register(name, email, password)
  verifyEmail(token)
  forgotPassword(email)
  resetPassword(token, newPassword)
  googleOAuth(idToken)
  refreshProfile()
  logout()
}
```

#### PlayerContext
```typescript
{
  currentTrack: Track | null
  isPlaying: boolean
  play(track)
  pause()
  resume()
  stop()
  seek(position)
}
```

### Configuração (app.json)

```json
{
  "expo": {
    "name": "mobile",
    "slug": "mobile",
    "version": "1.0.0",
    "extra": {
      "apiBaseUrl": "https://32462f7c3a49.ngrok-free.app/api/v1",
      "googleOAuth": {
        "expoClientId": "..."
      }
    },
    "plugins": [
      "expo-web-browser",
      ["expo-video", {
        "supportsBackgroundPlayback": true,
        "supportsPictureInPicture": true
      }]
    ]
  }
}
```

### API Service

```typescript
// Funções principais
apiLogin(email, password)
apiRegister(name, email, password)
apiGoogleOAuth(idToken)
apiProfile(accessToken)
apiGetProfiles(accessToken)
apiCreateProfile(accessToken, data)
apiUpdateProfile(accessToken, id, data)
apiDeleteProfile(accessToken, id)
apiGetWorks(accessToken, params)
apiGetWork(accessToken, id)
apiGetStreamingUrl(accessToken, trackId)
apiToggleFavorite(accessToken, workId, profileId)
```

---

## 🔐 Sistema de Autenticação

### Fluxo de Autenticação

```
1. Registro/Login
   ├─ Local (email + senha)
   │   ├─ Backend valida credenciais
   │   ├─ Gera JWT (accessToken + refreshToken)
   │   └─ Retorna tokens + dados do usuário
   │
   └─ Google OAuth
       ├─ Frontend/Mobile obtém idToken do Google
       ├─ Envia idToken para backend
       ├─ Backend valida com Google
       ├─ Cria/atualiza usuário
       └─ Retorna tokens + dados do usuário

2. Verificação de Email
   ├─ Usuário registra com email
   ├─ Backend envia email com token
   ├─ Usuário clica no link
   └─ Backend valida token e marca email como verificado

3. Recuperação de Senha
   ├─ Usuário solicita reset
   ├─ Backend envia email com token
   ├─ Usuário define nova senha
   └─ Backend valida token e atualiza senha

4. Refresh Token
   ├─ accessToken expira
   ├─ Cliente envia refreshToken
   └─ Backend retorna novo accessToken
```

### Segurança

- **JWT**: Tokens com expiração de 7 dias
- **Cookies**: httpOnly, sameSite=lax
- **Helmet**: Proteção de headers HTTP
- **CORS**: Configurado para origens específicas
- **Rate Limiting**: Throttler com múltiplos níveis
- **Validação**: class-validator em todos os DTOs
- **Hash**: bcrypt para senhas

---

## 🎵 Sistema de Mídia

### Tipos de Conteúdo

1. **Music** (Músicas)
   - Faixas individuais ou álbuns
   - Recomendação por idade (meses)
   - Tags (ninar, brincar, aprender, etc.)

2. **Audiobook** (Audiobooks)
   - Histórias narradas
   - Capítulos/faixas
   - Duração total

3. **Series** (Séries)
   - Episódios sequenciais
   - Temporadas (futuro)

### Streaming

- **HLS (HTTP Live Streaming)**: Streaming adaptativo
- **Processamento assíncrono**: Bull Queue + Worker
- **Storage**: Local ou AWS S3
- **URLs temporárias**: Expiração configurável

### Upload Flow

```
1. Admin faz upload de arquivo
   ↓
2. Backend salva arquivo temporário
   ↓
3. Job adicionado à fila (Bull)
   ↓
4. Worker processa arquivo
   ├─ Converte para HLS (múltiplas qualidades)
   ├─ Gera thumbnails
   └─ Upload para S3 (se configurado)
   ↓
5. Atualiza registro no banco
   ↓
6. Conteúdo disponível para streaming
```

---

## 👨‍👩‍👧‍👦 Sistema Multi-Perfil

### Conceito

Cada **usuário** (conta) pode ter múltiplos **perfis infantis**:

```
Usuário (Pai/Mãe)
  ├─ Perfil: João (3 anos)
  ├─ Perfil: Maria (5 anos)
  └─ Perfil: Pedro (1 ano)
```

### Funcionalidades

- **Controle Parental**: PIN para proteger perfis
- **Recomendações por Idade**: Filtro automático baseado em birthDate
- **Favoritos Separados**: Cada perfil tem seus próprios favoritos
- **Playlists Personalizadas**: Playlists por perfil
- **Histórico Individual**: Rastreamento de reprodução por perfil

---

## 💳 Sistema de Assinaturas

### Planos

```typescript
{
  name: "Básico" | "Premium" | "Família"
  priceCents: number
  billingPeriod: "monthly" | "yearly"
  features: string[]
}
```

### Status de Assinatura

- `active`: Assinatura ativa
- `canceled`: Cancelada (ainda válida até fim do período)
- `past_due`: Pagamento atrasado
- `unpaid`: Não pago

### Integração (Futuro)

- Stripe
- PayPal
- Mercado Pago

---

## 🚀 Deploy e Infraestrutura

### Docker Compose

O projeto inclui `docker-compose.yml` com:

```yaml
services:
  postgres:      # PostgreSQL 15
  redis:         # Redis 7
  backend:       # NestJS API
  media-worker:  # Worker para processamento de mídia
```

### Comandos

```bash
# Subir todos os serviços
docker-compose up -d

# Subir com worker
docker-compose --profile with-worker up -d

# Logs
docker-compose logs -f backend

# Parar
docker-compose down
```

### Ngrok (Mobile)

Para desenvolvimento mobile, o backend é exposto via ngrok:

```bash
ngrok http 3003
```

URL configurada em `mobile/app.json`:
```json
{
  "extra": {
    "apiBaseUrl": "https://xxxxx.ngrok-free.app/api/v1"
  }
}
```

---

## 📊 Banco de Dados

### Schema Principal

```
users
  ├─ profiles (1:N)
  ├─ subscriptions (1:N)
  ├─ favorites (N:M com works)
  └─ playlists (1:N)

works
  ├─ tracks (1:N)
  ├─ tags (N:M via work_tags)
  ├─ favorites (N:M com users)
  └─ play_events (1:N)

playlists
  └─ playlist_items (1:N)

subscriptions
  └─ plan (N:1)
```

### Índices Importantes

- `users.email` (unique)
- `profiles.userId`
- `works.type`
- `works.recommendedMinMonths`, `works.recommendedMaxMonths`
- `tracks.workId`
- `favorites.userId`, `favorites.workId`
- `play_events.userId`, `play_events.profileId`

---

## 🔄 Fluxo de Dados Completo

### Exemplo: Reproduzir uma Música

```
1. Mobile/Frontend
   └─ Usuário seleciona perfil infantil
       └─ setActiveProfileId(profileId)

2. Mobile/Frontend
   └─ Busca catálogo filtrado por idade do perfil
       └─ GET /works?profileId={id}&type=music

3. Backend
   └─ Calcula idade do perfil (birthDate)
   └─ Filtra obras por recommendedMinMonths/MaxMonths
   └─ Retorna lista de obras

4. Mobile/Frontend
   └─ Usuário clica em uma obra
       └─ GET /works/{workId}

5. Backend
   └─ Retorna detalhes + tracks

6. Mobile/Frontend
   └─ Usuário clica em play
       └─ GET /playback/{trackId}/url

7. Backend
   └─ Gera URL temporária (S3 signed URL ou local)
   └─ Retorna { url, expiresAt }

8. Mobile/Frontend
   └─ Player inicia reprodução
   └─ POST /playback/{trackId}/play (registro de evento)

9. Backend
   └─ Cria PlayEvent
       └─ { userId, profileId, trackId, timestamp }
```

---

## 🎯 Funcionalidades Principais

### ✅ Implementadas

- [x] Autenticação (local + Google OAuth)
- [x] Verificação de email
- [x] Recuperação de senha
- [x] Multi-perfil infantil
- [x] Catálogo de obras (música, audiobook, séries)
- [x] Sistema de tags
- [x] Filtro por idade recomendada
- [x] Favoritos por perfil
- [x] Playlists personalizadas
- [x] Streaming de áudio
- [x] Upload de mídia
- [x] Processamento HLS (worker)
- [x] Painel administrativo
- [x] Sistema de assinaturas (estrutura)
- [x] Rastreamento de reprodução

### 🚧 Em Desenvolvimento

- [ ] Integração com gateway de pagamento
- [ ] Notificações push
- [ ] Download offline
- [ ] Modo offline completo
- [ ] Recomendações personalizadas (ML)
- [ ] Controle parental avançado
- [ ] Estatísticas e analytics
- [ ] Testes automatizados

---

## 🛠️ Como Executar

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start --tunnel
```

### Docker (Completo)

```bash
docker-compose up -d
```

---

## 📝 Observações Importantes

### Isolamento e Modularidade

Conforme a memória do usuário:
> "To ensure isolation, the developer will always be able to create a controller, a model and a view for a specific purpose."

O projeto segue o padrão **MVC** (Model-View-Controller) com isolamento total:

- **Backend**: Cada módulo tem seu próprio controller, service, entities, DTOs
- **Frontend**: Componentes isolados, services separados
- **Mobile**: Screens, components e contexts independentes

### Boas Práticas Aplicadas

1. **Separation of Concerns**: Cada camada tem responsabilidade única
2. **DRY**: Código reutilizável em services e components
3. **Type Safety**: TypeScript em todo o projeto
4. **Validation**: DTOs validados com class-validator
5. **Error Handling**: Tratamento consistente de erros
6. **Security**: Múltiplas camadas de segurança
7. **Scalability**: Arquitetura preparada para crescimento

---

## 🎓 Conclusão

Este é um **sistema robusto e escalável** para uma plataforma de conteúdo infantil, com:

- ✅ Arquitetura moderna e bem estruturada
- ✅ Três aplicações integradas (Backend, Web, Mobile)
- ✅ Sistema completo de autenticação e autorização
- ✅ Multi-perfil com controle parental
- ✅ Streaming de mídia otimizado
- ✅ Pronto para produção (com ajustes de segurança)

**Tecnologias de ponta**: NestJS, Next.js 16, React 19, Expo, PostgreSQL, Redis, TypeScript

**Pronto para escalar**: Arquitetura modular, cache, filas, workers, CDN-ready
