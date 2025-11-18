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