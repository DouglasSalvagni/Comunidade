
Correção do HLS: URI da chave AES apontando para host inválido.

- Identificado que faixas recentes transcodadas geravam `#EXT-X-KEY` com `URI` em `http://backend:3001/...`, inacessível pelo navegador (host interno do Docker) e com porta divergente do `.env` local (3003).
- Atualizado fallback do `API_BASE_URL` no worker para `http://localhost:3003/api/v1` (`backend/src/workers/transcode.worker.ts`).
- Ajustado `docker-compose.yml` para definir `API_BASE_URL` do `media-worker` como `http://localhost:3001/api/v1`, garantindo que playlists em ambiente Docker usem host alcançável pelo browser.
- Observação operacional: faixas já transcodadas com `URI` antigo precisam ser reprocessadas via `POST /api/v1/media/process` para atualizar os manifests.
Build e restart do serviço media-worker para aplicar correção.

- Executado `docker compose build media-worker` e `docker compose up -d media-worker` na raiz do projeto, garantindo que o novo `API_BASE_URL` seja usado na geração dos manifests HLS futuros.
- Verificado nos logs do container que o worker iniciou e conectou ao Redis com sucesso.
Chave HLS servida via CDN para evitar mixed content.

- Alterado o worker para publicar a chave AES (`enc.key`) no mesmo prefixo dos manifests HLS e referenciar `URI` absoluto no CDN/S3 em vez de endpoint HTTP local.
- Implementado upload da chave para S3 e uso de `CDN_BASE_URL` quando disponível; fallback para `S3_ENDPOINT/S3_BUCKET`.
- Rebuild e restart do `media-worker` concluídos.
Inicialização do app mobile (Expo).

- Removida pasta `.expo` antiga em `mobile/` para permitir scaffold limpo.
- Criado projeto Expo TypeScript com `create-expo-app` em `mobile/`.
- Dependências instaladas automaticamente; scripts `start/android/ios/web` disponíveis.
- Confirmada estrutura: `App.tsx`, `app.json`, `tsconfig.json`, `package.json` com Expo SDK 54.
Servidor Expo em modo tunnel para testes no celular.

- Executado `expo start --tunnel` em `mobile/`.
- Tunnel conectado e pronto, URL `exp://swo8niy-anonymous-8081.exp.direct` disponível para Expo Go.
Backend ouvindo em `0.0.0.0`.

- Alterado `await app.listen(port)` para `await app.listen(port, '0.0.0.0')` (`backend/src/main.ts:75`).
- Compilado projeto backend para validar alteração.
Preparação do túnel para backend via ngrok.

- Tentativa de `npx ngrok http 3003` falhou por ausência de `authtoken`.
- Necessário configurar `authtoken` via `npx ngrok config add-authtoken <TOKEN>` antes de abrir o túnel.
Configuração do authtoken do ngrok e erro de autenticação.

- Authtoken salvo em `C:\Users\Douglas\AppData\Local\ngrok\ngrok.yml`.
- Execução do túnel retornou `ERR_NGROK_105` (authtoken inválido).
- Aguardando novo `NGROK_AUTHTOKEN` válido para publicar o backend em `3003`.
Túnel ngrok ativo para backend local (porta 3003).

- Novo authtoken configurado e sessão estabelecida.
- URL pública: `https://0599aeb68d94.ngrok-free.app` apontando para `http://localhost:3003`.
Interfaces de autenticação no app mobile (Expo).

- Adicionadas telas: Login, Criar Conta, Verificar E-mail, Recuperar Senha, Redefinir Senha, Home.
- Implementado `AuthContext` com chamadas ao backend (`/auth/*`).
- Definido `extra.apiBaseUrl` em `app.json` para usar o endpoint público do ngrok.
Captura de erros no mobile ajustada para debugging.

- Removidos modais `Alert` de erro nas telas de autenticação.
- Erros agora são logados no console e exibidos inline na UI.
Validação de formulários no mobile.

- Login: valida e-mail e tamanho mínimo da senha antes de enviar.
- Registro: valida nome, e-mail e senha com letra+número e 6+ caracteres.
- Recuperação/Reset: valida formatos mínimos e exibe mensagens claras.
- Parsing de erro da API: normaliza mensagens JSON do backend.
Tema escuro infantil aplicado ao mobile.

- Fundo escuro (#0b1023), textos claros (#e6e9ff/#cfd3ff).
- Botões com tom claro (#ffd66b) e texto escuro para contraste.
- Inputs com fundo escuro (#121632) e borda (#3a3f5a).
- Elementos decorativos de lua/estrela adicionados nas telas principais.
Fluxo de recuperação de senha no mobile alinhado ao web.

- Após solicitar recuperação, exibimos instrução para usar o link enviado por e-mail.
- Removida navegação para tela de redefinição interna; retorno ao login após instrução.
Fluxo de criação de conta e verificação de e-mail no mobile.

- Após cadastro, mostramos aviso para confirmar e-mail via link recebido.
- Nova tela `VerificationNoticeScreen` com opções de reenviar e voltar ao login.
- Login trata `E-mail não verificado`: oferece reenviar e abrir instruções.
Login social Google funcional no mobile.

- Adicionadas dependências: `expo-auth-session` e `expo-web-browser`.
- Implementado fluxo com `useAuthRequest` e `promptAsync({ useProxy: true })` para obter `id_token` no Expo Go sem exigir SHA-1.
 - Ajustado tipagem para `useIdTokenAuthRequest({ clientId })` compatível com SDK atual; evita exigir `androidClientId` no desenvolvimento com proxy.
- Chama endpoint do backend `/auth/oauth/google` via `googleOAuth` no contexto.
- Lê IDs do Google de `app.json > expo.extra.googleOAuth`; exibe erro se ausente.
Configuração do Client ID do Google no mobile.

- Adicionado `expo.extra.googleOAuth.expoClientId` em `mobile/app.json` usando o valor do web (`frontend/.env.local:3`).
Notas de configuração para Google OAuth (Expo Go).

- Consent Screen externo em modo Testing com usuário de teste.
- Adicionar Redirect URI: `https://auth.expo.io/@<expo-username>/mobile` (ou `@anonymous` se não logado).
- UI: Segundo botão em telas de Login, Criar Conta e Esqueci Senha agora é outline (contorno/texto amarelo, fundo transparente). Espaçamento de 12px entre botões adjacentes.
- UX de teclado nas telas de Login/Criar Conta/Esqueci Senha: conteúdo agora eleva suavemente quando o teclado aparece (Animated + KeyboardAvoidingView), evitando sobreposição.
- Documento `production_checklist.md` criado na raiz com checklist conciso para colocar web, backend e mobile em produção (auth Google Android/iOS, Docker produção, CORS S3/R2, segurança, observabilidade, DNS e validações).
