

Página de Conta no mobile (editar nome e senha condicional).

- Criada `AccountScreen` com edição de nome e visualização de e-mail (somente leitura). Alteração de senha disponível apenas para `authProvider=local`; para login social (Google), exibe aviso e oculta formulário (mobile/src/screens/AccountScreen.tsx).
- Adicionados métodos de API: `PATCH /auth/profile` e `PATCH /auth/profile/password` no cliente mobile (`mobile/src/services/api.ts`).
- Estendido `AuthContext` para incluir `authProvider` e método `refreshProfile` para recarregar dados após alterações (mobile/src/context/AuthContext.tsx).
- Integrado item "Conta" no menu de Configurações da Home; navega para a nova tela e botão "Voltar" retorna ao menu (mobile/src/screens/HomeScreen.tsx).
- Checagem de tipos executada em `mobile/`: `npx tsc --noEmit` sem erros.
- Ajuste visual do e-mail na tela de Conta: campo de e-mail com opacidade reduzida para comunicar claramente que é não editável (mobile/src/screens/AccountScreen.tsx).
- Validação de senha nova alinhada ao backend/web: exige confirmação igual e mínimo de 6 caracteres antes de habilitar o envio (mobile/src/screens/AccountScreen.tsx; backend/src/modules/auth/dto/change-password.dto.ts:11).

Tela de Catálogo no mobile.

- Criada `CatalogScreen` com listagem de obras, busca por título, filtro de tipo (Todos/Música/Audiobook/Série), intervalo de idade (anos/meses com conversão para meses) e seleção de tags derivadas das obras carregadas (mobile/src/screens/CatalogScreen.tsx).
- Adicionada função `apiGetWorks` com suporte a parâmetros `type`, `search`, `minMonths`, `maxMonths`, `tags`, `page`, `limit`, `profileId` e cabeçalho `Authorization` (mobile/src/services/api.ts).
- Integrada a tela de Catálogo ao tab `Catálogo` na navegação inferior (mobile/src/screens/HomeScreen.tsx).
- Checagem de tipos executada em `mobile/`: `npx tsc --noEmit` sem erros após ajustes.
Correções no Catálogo (flicker e filtros).

- Removida dependência de `computedTags` no `useEffect` que carrega obras para evitar recarregamentos sucessivos e estado `Carregando` piscando (mobile/src/screens/CatalogScreen.tsx:92).
- Filtro `tipo`: enviado ao backend apenas para valores aceitos (`music` e `audiobook`), evitando erros quando selecionado `Série` (mobile/src/screens/CatalogScreen.tsx:101).
- Intervalo de idade: agora aceita mínimo e máximo independentes — envia `minMonths` e/ou `maxMonths` separadamente com conversão de anos→meses (mobile/src/screens/CatalogScreen.tsx:106-108).

Ajustes adicionais conforme testes no mobile.

- Removida opção "Série" da UI de tipo do catálogo; filtros oferecem apenas `Todos`, `Música`, `Audiobook` (mobile/src/screens/CatalogScreen.tsx:88-93).
- Intervalo de idade espelhado do web: aplica filtro apenas quando `mín` e `máx` estão preenchidos; converte anos→meses e envia ambos (mobile/src/screens/CatalogScreen.tsx:53-55).
- Thumbnail dos cards agora ocupa toda a altura do card: imagem com `alignSelf: 'stretch'` e sem altura fixa, acompanhando o conteúdo (mobile/src/screens/CatalogScreen.tsx:173-174).
- Correção visual: campo `máx` do intervalo de idade não aparecia por conflito de layout; envolvido cada `Input` em contêiner com `flex: 1` dentro da linha para dividir a largura e exibir ambos lado a lado (mobile/src/screens/CatalogScreen.tsx:104-107).

Dropdown de filtros no Catálogo (mobile).

- Adicionado botão com ícone de filtro ao lado do campo de busca; ao tocar, abre/fecha os filtros adicionais (tipo, idade, tags) e permanece aberto até novo toque (mobile/src/screens/CatalogScreen.tsx:95-101, 103-107, 109-147).
- Estilos para o botão de ícone e linha de busca adicionados (mobile/src/screens/CatalogScreen.tsx:160-162).
- Alinhamento do botão de filtros com o campo de busca: adicionada opção `labelHidden` ao componente `Input` para ocultar o label e alinhar o botão na mesma linha do campo (mobile/src/components/Input.tsx; aplicado no campo de busca em mobile/src/screens/CatalogScreen.tsx:97-99).

Skeletons de carregamento no Catálogo.

- Substituída mensagem "Carregando..." por skeletons de cards durante fetch/refresh para melhorar a UX (mobile/src/screens/CatalogScreen.tsx:122-146, 170-181).

Paginação com carregamento infinito no Catálogo (mobile).

- Implementada paginação com carregamento ao rolar, respeitando filtros aplicados; adicionados estados `page`, `limit`, `totalPages` e `loadingMore`, além de handler `onScroll` que dispara `loadMoreIfNeeded` (mobile/src/screens/CatalogScreen.tsx:30-31, 33-36, 84-121, 139-146, 156-176).
- Skeletons também são exibidos no rodapé durante `loadingMore` para indicar carregamento incremental (mobile/src/screens/CatalogScreen.tsx:156-176).

Ajuste de navegação em Minha Conta.

- Botão "Voltar" movido para o topo direito com mesmo estilo da tela Perfis; adicionada barra de header e removido botão inferior (mobile/src/screens/AccountScreen.tsx:92-100, 131-132, 139-154).

Skeletons na lista de Perfis.

- Exibidos skeletons enquanto a lista de perfis é carregada; inclui círculo de seleção, linhas de nome/data e ícones placeholders (mobile/src/screens/ProfilesScreen.tsx:136-154, 254-260, 271-273).

Mini Player persistente no mobile (HLS).

- Adicionados métodos de API no mobile: obter URL de streaming `GET /playback/:trackId/url` e alternar favorito `POST /works/:id/favorite` com `profileId` opcional (mobile/src/services/api.ts).
- Criado `PlayerContext` que gerencia faixa atual, obra atual, estado de reprodução, posição e favorito; utiliza `expo-av` `Video` para reprodução de HLS e áudio remoto, com `onPlaybackStatusUpdate` para refletir play/pause, posição e fim (mobile/src/context/PlayerContext.tsx).
- Instalado `expo-av` nas dependências do projeto mobile para suporte nativo a HLS (android/iOS) (npm install expo-av).
- Integrado `PlayerProvider` na árvore do app, envolvendo as telas para prover estado persistente de player (mobile/App.tsx:50-53).
- Implementado `MiniPlayer` flutuante acima da barra de navegação, com título da faixa, nome da obra, botão play/pause e favorito; ao tocar na barra, prepara a abertura da futura tela de player (mobile/src/components/MiniPlayer.tsx).
- Posicionado `MiniPlayer` na `HomeScreen` logo acima da `BottomNav` para persistência em todas as abas (mobile/src/screens/HomeScreen.tsx:61-64).
- Ação de tocar uma obra: cards do catálogo agora são tocáveis e disparam `playWork`, que carrega a primeira faixa da obra e inicia reprodução com HLS quando disponível (mobile/src/screens/CatalogScreen.tsx:214-232, 19-23, 21-23, 25-26).
- Checagem de tipos executada após alterações: `npx tsc --noEmit` sem erros.

Correção: chaves duplicadas no Catálogo (lista paginada).

- Ao carregar mais páginas, alguns itens repetiam o mesmo `id` e causavam o aviso `Encountered two children with the same key`. Implementada deduplicação por `id` ao definir `works` tanto no carregamento inicial quanto no `loadMore` (mobile/src/screens/CatalogScreen.tsx:66-72, 108-114).

Ajustes de reprodução e exibição do Mini Player.

- `Video` (expo-av) agora chama `playAsync()` ao definir `streamUrl` se `isPlaying` estiver ativo, garantindo início imediato da reprodução (mobile/src/context/PlayerContext.tsx:95-103).
- `MiniPlayer` com `elevation` para aparecer acima da barra de navegação, evitando sobreposição visual no Android (mobile/src/components/MiniPlayer.tsx:35).

Fallback ao tocar obra sem faixas carregadas.

- Adicionado `apiGetWork` no cliente mobile para obter detalhes/`tracks` de uma obra (mobile/src/services/api.ts).
- No `CatalogScreen`, ao tocar no card, se a obra não tiver `tracks` carregadas, busca a obra completa e só então inicia a reprodução, garantindo robustez após reload do Expo Go (mobile/src/screens/CatalogScreen.tsx:214-232).

Mini Player aparece antes da URL e inicia assim que disponível.

- Ajustado `playTrack` para definir `currentWork/currentTrack` e estado de play antes de buscar a URL; se a URL falhar, desativa `isPlaying`, mas mantém o Mini Player visível para feedback imediato (mobile/src/context/PlayerContext.tsx:43-56).

Correção crítica: token de autenticação não atualizava no Player após reload.

- O `value` do `PlayerContext` era memorizado sem depender de `accessToken/activeProfileId`, mantendo funções com closures antigas (token `null`) após login/reload. Incluídas dependências `accessToken` e `activeProfileId` para atualizar as funções do contexto e permitir `playTrack` corretamente (mobile/src/context/PlayerContext.tsx:99-101).

Mini Player posicionado dinamicamente acima do BottomNav usando Safe Area.

- `BottomNav` passa sua altura via `onHeight` medindo o `SafeAreaView` (mobile/src/components/BottomNav.tsx:32).
- `HomeScreen` guarda `bottomNavHeight` e injeta em `MiniPlayer` como `bottomOffset` (mobile/src/screens/HomeScreen.tsx:20,56-68).
- `MiniPlayer` usa `bottomOffset` e remove margem fixa, garantindo posição correta acima da barra, respeitando o safe area (mobile/src/components/MiniPlayer.tsx:6,13,32).

Ajustes visuais: margem inferior e contraste para destaque.

- Pequena margem adicional de 8px acima do BottomNav para afastamento (mobile/src/components/MiniPlayer.tsx:13).
- Paleta invertida para maior contraste em tema escuro: fundo claro, textos escuros, ícones escuros; mantendo `elevation` (mobile/src/components/MiniPlayer.tsx:36-43).

Novas features do Mini Player: abrir tela e arrastar para dispensar.

- Clique no Mini Player abre um overlay simples de player, com botão de fechar (mobile/src/screens/HomeScreen.tsx:57-68, 74-80).
- Gesto horizontal com `PanResponder` permite arrastar; ao soltar além do limiar, anima saída e chama `stop()` para pausar e limpar estado (mobile/src/components/MiniPlayer.tsx:12-31).
- `PlayerContext` ganhou `stop()` para pausar o vídeo e limpar `currentWork/currentTrack/streamUrl` (mobile/src/context/PlayerContext.tsx:86-95), exposto no contexto (mobile/src/context/PlayerContext.tsx:98-101).

Bugfix: Mini Player reaparecia deslocado após dispensar.

- O `translateX` era persistido globalmente e não voltava a 0. Removida persistência global e reseta para 0 ao montar/alterar obra/faixa (mobile/src/components/MiniPlayer.tsx:8-10).

Bugfix crítico: violação das Regras de Hooks no Mini Player.

- `useRef/useEffect` estavam após um `return null` condicional, mudando a ordem de hooks entre renders e gerando erro de React. Foi movido o `return null` para depois dos hooks, garantindo ordem estável (mobile/src/components/MiniPlayer.tsx:8-14, 27-29).

Melhoria de UX: transparência progressiva ao arrastar.

- `opacity` interpolada por `translateX` de [-260, 0, 260] mapeando para [0.25, 1, 0.25], clareando conforme aproxima das pontas (mobile/src/components/MiniPlayer.tsx:10-13,16).

Limpeza: removidos logs do clique no catálogo para reduzir ruído.

- Remoção dos `console.log` dentro do `onPress` dos cards (mobile/src/screens/CatalogScreen.tsx:228-239).
