
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
- Mobile base: adicionados `BottomNav` com SafeArea (sem sobrepor barras nativas) e `ProfileSelector` no topo; integrados à `HomeScreen`.
- Modernização do design no mobile: botões primários em roxo (violet-600), textos e títulos mais limpos, links em violeta, inputs com foco roxo e fundo escuro de alto contraste, remoção de elementos infantis nas telas.
- BottomNav atualizado: ícones Ionicons modernos (`@expo/vector-icons`), itens distribuídos com `flex: 1`, estados ativos com violeta.
- BottomNav ocupa 100% da largura, sem recuos laterais; itens com `flex: 1` e ícones Ionicons compatíveis (home/albums/star/settings). Ajuste no container da Home para não limitar a largura.
- Otimização do `ProfileSelector` para iOS/Android: uso de `SafeArea` e `useSafeAreaInsets`, botão com `hitSlop`, modal com margens dinâmicas por insets para evitar conflito com áreas nativas.
- Adicionado `SafeAreaProvider` na raiz (`mobile/App.tsx`) para corrigir erro de safe area e garantir compatibilidade com `ProfileSelector` e `BottomNav`.
- SafeAreaProvider movido para raiz do App e remoção de early return em `Screens` para garantir que todas as rotas (autenticado e não autenticado) sejam renderizadas dentro do provider, eliminando o erro de safe area.

Navegação inferior: botão Playlist e gestão de perfis no mobile.

- Adicionado botão `Playlist` no BottomNav e suporte no `HomeScreen` (mobile/src/screens/HomeScreen.tsx), mantendo comportamento mínimo com placeholder.
- Em `Mais`, incluído item de menu `Perfis` e criada a tela `ProfilesScreen` com CRUD básico alinhado ao web (`/dashboard/profiles`).
- Atualizado `ProfileSelector` para carregar perfis reais do backend e selecionar ativo em tempo real (mobile/src/components/ProfileSelector.tsx).
- Extendido `AuthContext` com `activeProfileId` para refletir seleção de perfil no app (mobile/src/context/AuthContext.tsx).
- Adicionadas funções de API para perfis: listar, criar, atualizar e excluir (mobile/src/services/api.ts).

Checagem de tipos do projeto mobile.

- Executado `npx tsc --noEmit` em `mobile/`; sem erros de tipo após alterações.

Correções adicionais (mobile):

- Ícones do BottomNav estabilizados com mapeamento fixo de nomes do Ionicons (mobile/src/components/BottomNav.tsx) e remoção de strings livres por aba.
- Campo de data na tela de perfis convertido para DatePicker nativo (`@react-native-community/datetimepicker`), com formatação `YYYY-MM-DD` e validação mínima (mobile/src/screens/ProfilesScreen.tsx).
- Instalado módulo compatível: `npx expo install @react-native-community/datetimepicker`.
- Botão "Adicionar Perfil": adicionada margem superior e feedback de erro; logs de debug no console para facilitar diagnóstico (mobile/src/screens/ProfilesScreen.tsx).
- Validação adicional no botão: exige nome com 2+ caracteres e data válida antes do POST; desabilita durante envio e mostra rótulo "Adicionando..." (mobile/src/screens/ProfilesScreen.tsx).
- Tratamento de erro amigável no mobile: normalização de mensagens vindas do backend para evitar exibir JSON bruto na UI; fallback para mensagens curtas (mobile/src/services/api.ts, mobile/src/screens/ProfilesScreen.tsx).
- Forçado envio de `birthDate` em ISO completo (`YYYY-MM-DDT00:00:00.000Z`) para compatibilizar com validação estrita do backend; log do payload para depuração (mobile/src/screens/ProfilesScreen.tsx).
- Ajuste: retorno ao formato simples `YYYY-MM-DD` (como o web) para `birthDate` após novos testes; mantidos logs de payload e erros para diagnóstico.
- Backend (dev): adicionados logs de `body` e cabeçalhos (com `authorization` mascarado) no `DevExceptionFilter` para inspecionar o que chega no POST `/profiles`.
 - Corrigido merge de headers no cliente: garantia de manter `Content-Type: application/json` e `Accept: application/json` sem sobrescrever por `options.headers` (mobile/src/services/api.ts).
- UI perfis: substituídos botões de texto (Editar/Excluir) por ícones lado a lado com `Ionicons` para compactar ações na lista (mobile/src/screens/ProfilesScreen.tsx).
- Correção UX perfis: exclusão agora atualiza imediatamente e desabilita ícones durante processamento; edição mostra estado “Salvando...” e bloqueia envio, com atualização por `id` para evitar inconsistências (mobile/src/screens/ProfilesScreen.tsx).
- Feedback de sucesso na exclusão: adicionada mensagem “Perfil excluído” por 2s e remoção otimista com rollback em caso de falha (mobile/src/screens/ProfilesScreen.tsx).
- Modal de confirmação antes de excluir perfil; após confirmação, remove localmente, chama DELETE e re-carrega lista do backend para garantir consistência visual (mobile/src/screens/ProfilesScreen.tsx).
- Correção de cliente HTTP para respostas 204/sem JSON: evita quebra ao tentar `res.json()` em DELETE e retorna vazio; melhora robustez geral (mobile/src/services/api.ts).
 - Seleção de perfil ativo na tela de perfis: adicionados ícones de seleção e ação para definir `activeProfileId`; ao excluir o perfil ativo, escolhe automaticamente o próximo disponível (mobile/src/screens/ProfilesScreen.tsx).
- Removido seletor de perfil do topo direito; seleção passa a ocorrer na tela de Perfis (mobile/src/screens/HomeScreen.tsx, mobile/src/screens/ProfilesScreen.tsx).
- Ajuste visual na separação de perfis: aumentada a área de padding vertical da linha separadora para melhor espaçamento entre textos e botões (mobile/src/screens/ProfilesScreen.tsx).
