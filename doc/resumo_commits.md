Implementado feedback visual ao adicionar à playlist.

- Alterado `frontend/src/components/AudioPlayer.tsx` para adicionar estado de pulso do botão da playlist (`pulsePlaylistBtn`).
- Disparo do pulso ao adicionar faixa via `__player_addTrack`.
- Aplicadas classes de brilho amarelo e leve aumento de escala nos botões de playlist (mobile e desktop).

Extraído o card do catálogo para componente reutilizável.

- Criado `frontend/src/components/ContentCard.tsx` com API mínima (`work`, `onToggleFavorite`, `onPlay`, `onAddToPlaylist`, flags `showTags` e `showAge`).
- Substituído o markup inline em `frontend/src/app/dashboard/catalog/page.tsx` pelo componente `ContentCard`.

Aplicado o ContentCard na raiz da dashboard.

- Atualizado `frontend/src/app/dashboard/page.tsx` para usar `ContentCard` nos blocos de favoritos e sugestões.
- Adicionados handlers locais (`handleFavoriteToggle`, `handlePlay`, `handleAddToPlaylist`).

Ajustes no ContentCard de layout.

- Aumentada a altura da thumbnail para `h-56`.
- Reorganizados botões: `Play` e `Adicionar à playlist` em largura total (`w-full`), cada um em uma linha, com informativo de idade acima.

Refino de altura da thumbnail.

- Ajustada a altura de `h-56` para `h-52` em `frontend/src/components/ContentCard.tsx` para reduzir levemente a imagem.
Página de edição de perfil do usuário na Dashboard.

- Criado `frontend/src/app/dashboard/account/page.tsx` com formulário simples para editar o nome do usuário e visualizar o e-mail.
- Adicionado método `updateMyProfile` em `frontend/src/services/api.ts` apontando para `PATCH /auth/profile`.
- Adicionado link "Meu Perfil" na Sidebar (`frontend/src/components/Sidebar.tsx`).

Endpoint no backend para atualizar o perfil do usuário autenticado.

- Adicionado `PATCH /auth/profile` em `backend/src/modules/auth/auth.controller.ts`.
- Implementada lógica em `backend/src/modules/auth/auth.service.ts` para atualizar apenas o `name`.
- Criado DTO `backend/src/modules/auth/dto/update-profile.dto.ts` (campo opcional `name`).

Tratamento de erro ao favoritar sem perfil ativo.

- Atualizado `frontend/src/app/dashboard/catalog/page.tsx` e `frontend/src/app/dashboard/page.tsx` para exibir toast informando que é necessário selecionar ou criar um perfil quando não houver `activeProfileId` ou quando a API retornar 403 por perfil não pertencente ao usuário.

Adequação da página “Meu Perfil” para contas locais e sociais.

- Backend: adicionada coluna `auth_provider` em `users` com migration `1732200000000-auth-provider.ts` e propriedade `authProvider` em `User`.
- Registro: corrigido para salvar `passwordHash` via `createWithPasswordHash` e marcar `authProvider='local'`.
- Login Google: ao criar usuário, seta `authProvider='google'`.
- Novo endpoint: `PATCH /auth/profile/password` para troca de senha (somente `authProvider=local`).
- Frontend: adicionados `authProvider` no tipo `User` e método `changeMyPassword` em `src/services/api.ts`.
- Página “Meu Perfil”: `src/app/dashboard/account/page.tsx` passou a exibir seção de troca de senha somente para contas locais e aviso para contas sociais.

Correção de redirecionamento indevido em 401 ao trocar senha.

- Ajustado interceptor em `frontend/src/services/api.ts` para não redirecionar para login em 401 provenientes de `/auth/profile/password` ou quando estiver em `/dashboard/account`, mantendo apenas o toast.
- Página de Login agora redireciona para a Dashboard se o usuário já estiver autenticado (`frontend/src/app/auth/login/page.tsx`).

Localização das mensagens de troca de senha no backend.

- Atualizado `backend/src/modules/auth/auth.service.ts` para mensagens em PT-BR: "Usuário não encontrado", "Alteração de senha não disponível para login social" e "Senha atual incorreta".

Início da feature de recuperação de senha via e-mail.

- Backend: adicionados campos `password_reset_token_hash` e `password_reset_expires_at` em `User` com migration `1732200000001-user-reset-fields.ts`.
- Criado `MailService` (`backend/src/modules/auth/mail.service.ts`) usando SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) e `nodemailer`.
- Endpoints novos no Auth: `POST /auth/password/forgot` (envia e-mail) e `POST /auth/password/reset` (valida token e troca a senha).
- Frontend: métodos `requestPasswordReset` e `resetPassword` em `src/services/api.ts`.
- Páginas novas: `src/app/auth/forgot/page.tsx` (solicitar e-mail) e `src/app/auth/reset/page.tsx` (informar token e nova senha). Link "Esqueceu sua senha?" no login aponta para `/auth/forgot`.

Correção de erro ao iniciar em modo desenvolvimento (`start:dev`).

- Ajustada injeção do `MailService` no `AuthService` (tipagem e import adequados) para resolver erro de dependências do Nest: "Nest can't resolve dependencies of the AuthService".

Depuração do envio de e-mails de recuperação.

- Verificação de variáveis SMTP no `.env` e script `npm run smtp:check` para testar conectividade.
- Ajuste no `MailService` para usar `SMTP_USER` como remetente e forçar `envelope.from`, evitando erro 553 5.7.1 de remetente não autorizado.
- Logs adicionados no `MailService` para acompanhar remetente e confirmação de envio.
- Testes unitários adicionados: `mail.service.spec.ts` (transporter, remetente e envelope) e `auth.service.spec.ts` (fluxo forgot/reset).

Verificação de e-mail (confirmar conta).

- Adicionadas colunas `email_verification_token_hash` e `email_verification_expires_at` em `User` com migration `1732200000002-user-email-verification.ts`.
- `MailService` agora envia e-mail de verificação (`sendEmailVerification`).
- `AuthService`: gera token e envia verificação no `register`; adicionados métodos `requestEmailVerification(email)` e `verifyEmail(token)`.
- `AuthController`: novos endpoints `POST /auth/email/verify/request` e `POST /auth/email/verify`.
- `JwtStrategy`: bloqueia acesso para contas locais com `emailVerified=false` com mensagem "E-mail não verificado".
- Frontend: métodos `requestEmailVerification` e `verifyEmail` na API e página `/auth/verify` para confirmar token.

Ajustes no fluxo de registro/login para exigir verificação:

- `AuthService.register`: não retorna tokens para contas locais não verificadas.
- `AuthController.register`: só grava cookie de `accessToken` se houver token.
- `AuthService.login`: bloqueia login de contas locais com e-mail não verificado.
- Frontend `/auth/register`: após cadastro local não verificado, armazena `pendingEmail` e redireciona para `/auth/pending`.

Automatização da verificação e experiência de pendência:

- `MailService`: leitura de SMTP via `ConfigService` com fallback para `process.env`.
- `AuthService.verifyEmail`: ao confirmar, retorna `AuthResponse` com tokens.
- `AuthController.verify`: grava cookie de `accessToken` após verificação.
- Frontend `/auth/verify`: verifica automaticamente o token da URL, autentica e redireciona para a dashboard; em caso de expiração, oferece reenvio de link.
- Frontend `/auth/pending`: página informativa para aguardar confirmação e reenviar verificação.
- Interceptor da API: para 401 em rotas de dashboard/admin, redireciona para `/auth/pending` (ou mensagem de e-mail não verificado).
- Dashboard layout: remove autologin Google e redireciona para `/auth/pending` se não autorizado.
- Dashboard layout: valida `emailVerified=false` e redireciona para `/auth/pending` mesmo com sessão existente.

Envio de e-mail de teste via script.

- Adicionado script `smtp:send-test` que envia um e-mail de teste usando o SMTP configurado. Executado com sucesso para `douglassalvagni@gmail.com`.
 
Validações operacionais da verificação de e-mail.

- Backend reiniciado em desenvolvimento e reconstruído; rotas atualizadas registradas.
- Corrigido 404 anterior: `POST /api/v1/auth/email/verify/request` responde 200 OK após restart.
- Registro local testado: persistência de `emailVerificationTokenHash`/`emailVerificationExpiresAt` e retorno sem tokens enquanto não verificado.
- Login bloqueado para e-mail não verificado com 401 (mensagem "E-mail não verificado").
- `POST /api/v1/auth/email/verify` retornando 401 para token inválido (fluxo de segurança ok).
- Observação: em produção, build gerou `dist/src/main.js`; `start:prod` espera `dist/main`. Mantido `start:dev` para testes locais.

Ajuste de login social (Google) para exibir consentimento.

- Configurado `prompt=consent` no provider do Google do NextAuth para forçar a tela de consentimento quando necessário (`frontend/src/app/api/auth/[...nextauth]/route.ts:5-21`).

Mensagens de validação (login e cadastro) traduzidas para PT-BR.

- Login: `Credenciais inválidas` e `Conta desativada` em `backend/src/modules/auth/auth.service.ts:32-37`.
- Cadastro: conflito `Já existe usuário com este e-mail` em `backend/src/modules/auth/auth.service.ts:60`.
- Refresh: `Refresh token inválido` em `backend/src/modules/auth/auth.service.ts:107,121`.
- Google OAuth: `Token do Google inválido`, `Conta Google não verificada`, `Audiência do token inválida` em `backend/src/modules/auth/auth.service.ts:145,149,154`.
- Perfil: `Usuário não encontrado` em `backend/src/modules/auth/auth.service.ts:128,136`.

Melhorias UX: visualizar senha nos formulários.

- Adicionada opção de mostrar/ocultar senha em páginas com campos de senha:
  - Login do usuário (`frontend/src/app/auth/login/page.tsx:93-99`)
  - Cadastro (`frontend/src/app/auth/register/page.tsx:30-36`)
  - Redefinição de senha (`frontend/src/app/auth/reset/page.tsx:49-65,58-66`)
  - Login admin (`frontend/src/app/admin/login/page.tsx:49-55`)
  - Alteração de senha na conta (`frontend/src/app/dashboard/account/page.tsx:92-108,99-108,103-112`)

Perfis: criação com campos obrigatórios e atualização do seletor.

- Frontend `/dashboard/profiles`: exigidos `Nome` e `Data de nascimento` ao criar perfil, com validação de formato `YYYY-MM-DD` e mensagem de erro quando incompleto (`frontend/src/app/dashboard/profiles/page.tsx:137-148`).
- Ao criar perfil, disparado evento global `profiles-refresh` para recarregar a lista de perfis no seletor do cabeçalho (`frontend/src/app/dashboard/profiles/page.tsx:142-145`).
- Seletor de perfis (`frontend/src/components/ProfileSwitcher.tsx`): agora escuta `profiles-refresh` e refaz o carregamento, mantendo o perfil ativo salvo em `localStorage` (`frontend/src/components/ProfileSwitcher.tsx:39-45,66-84`).
- Backend DTO de criação de perfil: `birthDate` passou a ser obrigatório e validado como data (`backend/src/modules/profiles/dto/create-profile.dto.ts:14-21`).

Worker de mídia (HLS): correção de build e inicialização.

- Docker do worker: caminho do script ajustado para `dist/src/workers/transcode.worker.js`, compatível com a saída atual de build (`backend/Dockerfile.worker`).
- Docker do worker: inicialização com resolução de aliases adicionando `-r tsconfig-paths/register` ao comando (`backend/Dockerfile.worker`).

Integração R2 (Cloudflare) no docker-compose.

- Removidos serviços MinIO do `docker-compose.yml`.
- Adicionado `env_file: ./backend/.env` aos serviços `backend` e `media-worker` para carregar `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` e `CDN_BASE_URL` já definidos.
- `API_BASE_URL` do worker mantido como `http://backend:3001/api/v1` para uso na rede interna do Compose.
Landing page do Inspira integrada ao frontend (Next.js).

- Adicionadas cores `brand` ao Tailwind (`frontend/tailwind.config.ts`) para compatibilidade com classes da landing.
- Criados componentes da landing em `frontend/src/components/inspira/`: `NavbarInspira.tsx`, `HeroInspira.tsx`, `FeaturesInspira.tsx`, `AudioPreviewInspira.tsx`, `PricingInspira.tsx`, `FooterInspira.tsx`.
- Atualizada a home (`frontend/src/app/page.tsx`) para renderizar a nova landing exatamente na mesma ordem e estilos do projeto `inspira`, incluindo fundo `bg-brand-dark`, texto branco e cores de seleção.
- Instalado `framer-motion` no frontend para suportar animações da landing.
Correção de hydration mismatch na Hero da landing.

- Ajustada a renderização dos “estrelas” para ocorrer somente no cliente, evitando uso de `Math.random()` no SSR e removendo divergências entre HTML do servidor e do cliente.
- Implementado `mounted` e `suppressHydrationWarning` no wrapper das estrelas (`frontend/src/components/inspira/HeroInspira.tsx`).
Ajuste visual: sorriso no dragão da hero.

- Adicionado traço curvo simulando sorriso no `DragonSVG` da seção Hero (`frontend/src/components/inspira/HeroInspira.tsx`).
Refino visual: boca e olhos do dragão.

- Boca com cor verde escura compatível com a paleta do dragão (`#166534`).
- Olhos mais amigáveis: aumento do tamanho da íris e esclerótica, traço do contorno mais suave e ponto de brilho para dar vida (`frontend/src/components/inspira/HeroInspira.tsx`).
Orelhas do dragão ajustadas (remoção de chifres).

- Substituídas as formas circulares por orelhas pontudas com `path` para um visual mais amigável, mantendo a paleta (`frontend/src/components/inspira/HeroInspira.tsx`).
Ajuste fino: orelhas maiores e cauda saindo pela barriga.

- Orelhas do dragão levemente aumentadas para melhor proporção.
- Cauda reposicionada para emergir de trás na altura da barriga, com curva mais natural (`frontend/src/components/inspira/HeroInspira.tsx`).
Detalhes dracônicos e cauda elevada.

- Cauda elevada para sair um pouco mais alto pela barriga e curva ajustada (`M110 138 Q 160 185, 188 160`).
- Adicionados espinhos dorsais ao longo das costas para reforçar a identidade de dragão.
- Inseridos traços internos nas asas para sugerir membranas.
- Pequeno espinho adicional na cauda para acabamento.
- Arquivo: `frontend/src/components/inspira/HeroInspira.tsx`.
- Admin Catálogo: edição completa de obras (exceto áudio) e confirmação de remoção.

- Frontend `/admin/catalog`: diálogo de edição agora permite alterar tipo, idade recomendada (min/max/rótulo), tags e thumbnail. Upload/processing da thumbnail via `media/upload-url` + `media/process` e atualização de `coverUrl`. Adicionada modal de confirmação ao remover obra.
- Backend: `UpdateWorkDto` passou a aceitar `tagIds` e `CatalogService.update` atualiza relacionamento de tags (`backend/src/modules/catalog/dto/update-work.dto.ts`, `backend/src/modules/catalog/catalog.service.ts`).
- Admin Usuários: integração completa com backend.

- Frontend `/admin/users`: lista agora carrega do backend, edição em dialog (nome, email, perfil/role, ativo), toggle de status integrado e modal de confirmação para remover. Removido uso de mock.
- API do frontend: corrigidos endpoints para `/users` (lista e toggle), adicionados `adminUpdateUser` e `adminDeleteUser`.

Paginação na lista de usuários (admin).

- Frontend `/admin/users`: adicionada paginação client-side similar ao catálogo (5 itens por página, navegação com componentes de paginação).
- Landing page (Hero Inspira): substituído personagem dragão verde por ursinho de pelúcia.
- Implementado `TeddyBearSVG` e aplicado na cena pendurada do herói (`frontend/src/components/inspira/HeroInspira.tsx`).
- Ajuste visual do ursinho: barriga atrás do rosto e remoção/reposicionamento das bolinhas das pernas para baixo do corpo.
- Ursinho refinado: braços com proporções similares às pernas, ambos com cor próxima ao tom principal; personagem reposicionado para encostar na corda do pêndulo.
- Ajuste fino: aumentada a sobreposição da corda e reduzida a altura para aproximar ainda mais o ursinho da corda (`height=210px`, `overlap=48`).
