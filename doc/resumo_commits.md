# Resumo de Commits

## 2025-12-10 - Adição de Thumb na Timeline do Player Principal

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Adicionado um thumb (bolinha) na barra de progresso do player principal para facilitar o usuário a arrastar e navegar na música.

**Alterações:**
- Criado um container para a barra de progresso (`progressBarContainer`) com posicionamento relativo
- Adicionado elemento `progressThumb` com:
  - Diâmetro de 18px
  - Cor roxa (#A78BFA) combinando com a barra de progresso
  - Borda branca de 2px para melhor visibilidade
  - Sombra para efeito de elevação
  - Posicionamento dinâmico baseado no progresso da música
- O thumb acompanha automaticamente a posição atual da música
- Melhora a experiência do usuário ao permitir arrastar para qualquer posição desejada

---

## 2025-12-10 - Correção de Fluidez no Arraste do Thumb

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Corrigido problema de travamento ao arrastar o thumb e precisão ao buscar o início da música.

**Problemas resolvidos:**
1. O arraste do thumb estava "travado/pesado" porque cada movimento fazia um seek real no player
2. Ao arrastar para o início, não ia exatamente para 0 segundos

**Alterações:**
- Uso de `useRef` para AMBOS os valores:
  - `isDraggingRef`: Estado de arraste (síncrono)
  - `dragProgressRef`: Progresso durante arraste (síncrono)
  - `progressBarWidthRef`: Largura da barra para cálculos síncronos
- Estado `setRenderTrigger` apenas para forçar re-render quando necessário
- Função `getProgress()` que verifica refs de forma síncrona durante render
- Dividida a lógica de seek em 4 funções:
  - `handleSeekStart`: Inicia o arraste e atualiza posição visual
  - `handleSeekMove`: Atualiza apenas a posição visual (sem seek real)
  - `handleSeekEnd`: Executa o seek real apenas quando o usuário solta o dedo
  - `handleSeekTerminate`: Cancela arraste se interrompido pelo sistema
- Adicionados handlers de responder adicionais:
  - `onMoveShouldSetResponder`: Captura movimentos durante arraste
  - `onResponderTerminate`: Limpa estado se gesto for cancelado
  - `onResponderTerminationRequest`: Impede que outros componentes roubem o gesto
- **Resultado:** O uso de refs garante que todas as leituras de estado sejam síncronas,
  eliminando qualquer possibilidade de flicker causado por batching de setState

---

## 2025-12-10 - Correção de Flicker ao Soltar e Desabilitar Clique Direto

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Corrigido flicker ao soltar o thumb e desabilitado o clique direto na barra (apenas arraste funciona).

**Problemas resolvidos:**
1. Ao soltar o thumb, havia um flash rápido mostrando a posição anterior
2. Clicar na barra movia a posição (usuário queria apenas arrastar)

**Alterações:**
- Novo ref `pendingSeekRef`: Mantém a posição visual após soltar até o player confirmar
- Novos refs para detecção de arraste:
  - `touchStartXRef`: Registra posição inicial do toque
  - `hasDraggedRef`: Flag que indica se houve movimento real
- `DRAG_THRESHOLD = 5`: Mínimo de pixels para considerar um arraste (ignora toques simples)
- Effect que limpa `pendingSeek` quando posição do player chega perto do alvo (tolerância de 2%)
- `getProgress()` agora tem prioridade: `dragging > pendingSeek > position`
- Handlers refatorados:
  - `handleSeekStart`: Apenas registra posição inicial (não inicia arraste)
  - `handleSeekMove`: Só inicia arraste após threshold de 5px
  - `handleSeekEnd`: Só faz seek se `hasDraggedRef.current === true`
- **Resultado:** 
  - Sem flicker ao soltar (posição visual é mantida até player atualizar)
  - Clique simples não move a posição (apenas arraste funciona)

---

## 2025-12-10 - Seek Respeita Estado de Pause/Play

**Arquivo modificado:** `mobile/src/context/PlayerContext.tsx`

**Descrição:** Corrigido comportamento onde arrastar para nova posição sempre iniciava a reprodução, mesmo se estava pausado.

**Problema resolvido:**
- Ao arrastar o thumb para nova posição estando em pause, a música começava a tocar automaticamente

**Alterações na função `seekTo`:**
- Verifica estado de reprodução ANTES do seek: `statusBefore.isPlaying`
- Usa `setPositionAsync` ao invés de `playFromPositionAsync` (não auto-reproduz)
- Após mudar posição, só chama `playAsync()` se estava tocando antes

**Resultado:** 
- Se estava pausado → permanece pausado na nova posição
- Se estava tocando → continua tocando na nova posição

---

## 2025-12-10 - Correção de Alinhamento do Thumb Durante Arraste

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Corrigido deslocamento visual do thumb durante o arraste.

**Problema resolvido:**
- Ao arrastar o thumb, ele ficava levemente deslocado à direita em relação ao dedo

**Alteração:**
- Substituído `marginLeft: -9` por `transform: [{ translateX: -9 }]` no estilo `progressThumb`
- O `transform` centraliza o thumb sem afetar o cálculo de posição do evento de toque

**Resultado:** 
- Thumb agora fica exatamente centralizado no dedo durante o arraste

**Atualização:** Melhorias adicionais implementadas:
- Aumentado tamanho do thumb de 18px para **24px** (mais fácil de tocar)
- Ajustado `translateX` para -12px (metade do novo tamanho)
- Mudado de `locationX` para `pageX` para cálculo mais preciso
- Adicionado `progressBarOffsetXRef` para armazenar posição absoluta do container
- Usa `measureInWindow` no `onLayout` para capturar offset X do container
- Cálculo de progresso agora usa: `(pageX - offsetX) / width`

**Resultado final:**
- ✅ Thumb 33% maior (24px vs 18px) - mais fácil de manipular
- ✅ Alinhamento perfeito - thumb fica exatamente onde o dedo está
- ✅ Cálculo preciso usando coordenadas absolutas da tela

---

## 2025-12-19 - Adição de Botão Voltar para Login na Verificação Pendente

**Arquivo modificado:** `frontend/src/app/auth/pending/page.tsx`

**Descrição:** Adicionado um botão para retornar à tela de login na página de verificação pendente.

**Alterações:**
- Adicionado botão "Voltar para Login" usando o componente `Button` com variante `outline`
- Implementada navegação para a rota `/auth/login` ao clicar no novo botão
- O botão foi posicionado abaixo do botão de "Reenviar verificação" dentro do mesmo container

---

## 2025-12-19 - Correção de Layout Sidebar Mobile e Botão Fechar

**Arquivos modificados:** 
- `frontend/src/components/Header.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/ui/sheet.tsx`

**Descrição:** Resolvido o problema de áreas e linhas brancas no menu lateral mobile e melhorado o contraste do botão de fechar.

**Alterações:**
- **Sidebar**: Adicionado suporte a `className` customizada e permitindo sobrescrever larguras e bordas.
- **Header**: Aplicado `bg-sidebar` e `border-none` no container do Sheet e no componente Sidebar para eliminar frestas brancas.
- **Sheet UI**: Refilado o botão de fechar (`SheetClose`) para um círculo branco com ícone preto e sombra, garantindo visibilidade sobre o fundo escuro do menu.

---

## 2025-12-19 - Correção de Acessibilidade no Sheet (Falta de DialogTitle)

**Arquivo modificado:** `frontend/src/components/Header.tsx`

**Descrição:** Resolvido erro de console do Radix UI onde o `SheetContent` exigia um `DialogTitle`.

**Alterações:**
- Adicionado `SheetHeader`, `SheetTitle` e `SheetDescription` dentro do menu lateral no `Header.tsx`.
- Utilizada a classe `sr-only` para manter os elementos acessíveis para leitores de tela, mas invisíveis visualmente, respeitando o design atual.

---

## 2025-12-19 - Substituição de Loader por Skeleton na Conta

**Arquivo modificado:** `frontend/src/app/dashboard/account/page.tsx`

**Descrição:** Melhorado o feedback visual de carregamento na página de configurações de conta.

**Alterações:**
- Removido o spinner de carregamento genérico.
- Adicionado estado de Skeleton que simula o layout dos campos de nome, e-mail e formulário de alteração de senha, proporcionando uma transição visual mais suave.

---

## 2026-01-31 - Correção do Worker para Processar Eventos de Play (Top 10)

**Arquivos modificados:**
- `docker-compose-prod.yml`
- `backend/Dockerfile.worker`
- `backend/src/workers/worker.ts`
- `backend/src/workers/worker.module.ts`
- `backend/src/workers/processors/play-events.processor.ts`
- `backend/src/app.module.ts`
- `backend/src/modules/playback/playback.service.ts`

**Problema:**
- O Top 10 (músicas mais tocadas) não aparecia no mobile, mostrando apenas skeleton e depois vazio.
- Investigação revelou que a tabela `TrackPlayGlobalCount` estava vazia em produção.
- O worker de eventos de play não estava processando os jobs, apenas o worker de HLS.

**Causa raiz:**
- O `docker-compose-prod.yml` linha 66 tinha `command: ["node", "dist/src/workers/transcode.worker.js"]`
- Isso sobrescrevia o CMD do Dockerfile e executava apenas o worker de HLS
- O `PlayEventsProcessor` (que atualiza contadores) nunca era iniciado

**Correções:**
1. `docker-compose-prod.yml`: Alterado command para `worker.js` que inclui AMBOS os workers
2. `Dockerfile.worker`: Atualizado CMD para `worker.js` (consistência)
3. `worker.ts`: Adicionados logs de bootstrap para confirmar inicialização
4. `worker.module.ts` e `app.module.ts`: Corrigido fallback do Redis host para container name
5. `play-events.processor.ts`: Adicionado log de inicialização

**Resultado:**
- Worker agora processa tanto HLS quanto eventos de play
- Contadores de reprodução são atualizados corretamente
- Top 10 exibe as músicas mais tocadas

---

## 2026-01-31 - Implementação do Top 10 no Mobile

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Implementada a seção Top 10 na home do mobile, exibindo as músicas mais reproduzidas.

**Alterações:**
- Adicionada chamada à API `apiGetTopPlayed` no carregamento do dashboard
- Criada seção "Top 10" com lista vertical mostrando:
  - Ranking (1-10)
  - Capa da música
  - Título
  - Tipo (Música/Audiobook)
  - Botão de play
- Seção posicionada como primeira após a animação de curiosidade
- Adicionado skeleton loader durante carregamento
- Tratamento robusto de resposta (suporte a formatos `{ data: [...] }` e `[...]`)

---

## 2026-01-31 - Correção do Safe Area no Player Full Screen

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Corrigido problema onde o conteúdo do player full screen ficava atrás dos botões de navegação nativos em alguns dispositivos Android (testado no Galaxy S24).

**Problema:**
- Em dispositivos com barra de navegação por gestos ou botões virtuais, a parte inferior do player (botões de ação como Favoritar e Playlist) ficava oculta atrás dos controles do sistema.
- Tentativas anteriores com `paddingBottom`, `bottom: insets.bottom` e `SafeAreaView` não resolveram no Galaxy S24.
- **Causa raiz identificada:** O conteúdo do player tinha tamanhos fixos (capa 300x300px, margens fixas) que somados excediam a altura disponível em telas menores.

**Solução:**
1. **SafeAreaView com edges={['bottom']}** - Envolver o conteúdo do player (mesma abordagem do BottomNav)
2. **Layout Responsivo** - Tamanhos dinâmicos baseados na altura da tela:
   - Usa `useWindowDimensions` para obter altura da tela
   - Calcula `availableHeight = screenHeight - insets.top - insets.bottom`
   - Em telas menores (< 700px), reduz proporcionalmente:
     - `coverSize`: 300px → min(220, 32% da altura)
     - `smallMargin`: 30px → 16px
     - `mediumMargin`: 40px → 20px
3. **justifyContent: 'space-between'** - Distribui melhor os elementos na altura disponível

**Alterações técnicas:**
```tsx
// Imports atualizados
import { ..., useWindowDimensions } from 'react-native'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'

// Cálculo dinâmico de tamanhos
const { height: screenHeight } = useWindowDimensions()
const availableHeight = screenHeight - insets.top - insets.bottom
const isSmallScreen = availableHeight < 700
const coverSize = isSmallScreen ? Math.min(220, availableHeight * 0.32) : 300
const smallMargin = isSmallScreen ? 16 : 30
const mediumMargin = isSmallScreen ? 20 : 40

// Aplicação nos elementos
<Image style={[styles.playerCover, { width: coverSize, height: coverSize }]} />
<View style={[styles.playerHeader, { marginBottom: smallMargin }]}>
<View style={[styles.playerCoverWrap, { marginBottom: mediumMargin }]}>
```

**Resultado:**
- O player full screen agora se adapta a diferentes tamanhos de tela
- Todos os controles e botões de ação ficam visíveis e acessíveis
- Funciona corretamente em dispositivos como Galaxy S24 e Pocophone


---

## 2026-02-02 - Home Screen: Top 5 Global e Top 5 Pessoal

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Atualizad a seção de ranking na home screen para exibir "Top 5 Global" e adicionada nova seção "Suas Mais Ouvidas" (Top 5 Pessoal).

**Alterações:**
1. **Top Global:**
   - Reduzido limite de busca na API de 10 para 5 itens globalmente.
   - Renomeado título da seção de "Top 10" para "Top 5 Global".
2. **Top Pessoal:**
   - Implementada verificação e consumo do endpoint `apiGetMyTopPlayed` (verificado no backend como existente).
   - Adicionada nova seção "Suas Mais Ouvidas" com layout idêntico ao ranking global.
   - Limitado a 5 itens.
3. **UX/UI:**
   - Ambas as seções agora exibem 5 itens cada.
   - Skeleton loading ajustado para representar 5 itens placeholder.
   - "Suas Mais Ouvidas" aparece antes de "Top 5 Global" para priorizar conteúdo personalizado.

---

## 2026-02-02 - Home Screen: Ajuste de Texto Top 5

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Pequeno ajuste de copy na Home Screen.

**Alterações:**
1. Alterado título de "Top 5 Global" para "Top 5 no Ninaro".
2. Confirmado que a seção "Suas Mais Ouvidas" só renderiza se houver itens (`length > 0`), portanto não aparecerá para usuários sem histórico.

---

## 2026-02-02 - UI Redesign: My Top 5 e Global Top 5 Distintos

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Redesenhada a interface das seções de "Top 5" para diferenciá-las visualmente e melhorar a hierarquia.

**Alterações:**
1. **"Suas Mais Ouvidas" (My Top 5):**
   - Alterado de lista vertical para **Carrossel Horizontal** (ScrollView) de Cards Quadrados.
   - Adicionado um **Badge de Ranking** (#1, #2...) sobreposto no canto superior esquerdo de cada card.
   - Mantém consistência com outras seções horizontais, mas com o diferencial do badge.

2. **"Top 5 no Ninaro" (Global):**
   - Mantida lista vertical para reforçar conceito de "Ranking/lista".
   - **Ícones de Play:** Substituído ícone pequeno por `play-circle` maior e na cor primária (#A78BFA).

---

## 2026-02-02 - UI: Card "Top 1" em Dourado

**Arquivo modificado:** `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Implementado destaque visual exclusivo para o 1º lugar do ranking no "Top 5 no Ninaro".

**Alterações:**
1. **Background:** O card #1 agora possui fundo totalmente dourado (`#FFD700`).
2. **Contraste:** Para garantir legibilidade sobre o fundo dourado, todos os textos (título, subtítulo, ranking) e ícones desse card específico foram alterados para marrom escuro (`#422006` e `#78350f`).
3. **Harmonia:** Os elementos internos agora combinam com a estética "Premium Gold" solicitada, criando um destaque imediato para a obra mais ouvida.

---

## 2026-02-10 - Reprodução Contínua (autoPlayAfterTrack)

**Arquivos modificados:**
- `mobile/src/context/PlayerContext.tsx`
- `mobile/src/screens/AccountScreen.tsx`

**Descrição:** Implementada funcionalidade de reprodução contínua que, ao terminar uma faixa reproduzida fora de playlist, busca recomendações e toca automaticamente a próxima.

**Alterações:**

1. **Nova configuração `autoPlayAfterTrack`** (padrão: `true`):
   - Persistida via AsyncStorage (chave `player:autoPlayAfterTrack`)
   - Exposta via `PlayerContextValue` e `usePlayer()`

2. **Lógica de recomendação com fallback em cascata:**
   - Faixa etária + tags da obra atual
   - Faixa etária + devThemes da obra atual
   - Faixa etária apenas
   - Tags apenas
   - Minhas mais ouvidas (se perfil ativo disponível)
   - Top global

3. **Comportamento ao fim da faixa (`didJustFinish`):**
   - Playlist ativa → avança normalmente na playlist
   - `autoPlayAfterTrack = true` e sem playlist → busca recomendações e toca
   - `autoPlayAfterTrack = false` e sem playlist → para a reprodução

4. **Queue dinâmica (`queueSource: 'auto'`):**
   - Novo tipo de queue para faixas recomendadas
   - Suporta Next/Prev dentro da queue de recomendações
   - `hasNext` retorna `true` quando autoPlay está ativado (mesmo sem playlist)
   - `hasPrev` retorna `true` apenas se há faixa anterior na queue auto

5. **Toggle na UI de configurações:**
   - Nova seção "Reprodução" com toggle "Reprodução contínua"
   - Posicionada acima do toggle existente de loop de playlist

---

## 2026-02-10 - Correção de Exibição de Erros HTML no App

**Arquivo modificado:** `mobile/src/services/api.ts`

**Problema:**
- Quando o servidor retornava erro 502 Bad Gateway (página HTML do Cloudflare), o HTML cru era exibido diretamente na tela do usuário (ex: na tela de Conta)
- Bug estrutural: o `throw` dentro do `try` era capturado pelo seu próprio `catch`, fazendo o fluxo cair no fallback que jogava o HTML bruto como mensagem de erro

**Correções:**
1. Separado `JSON.parse` do `throw` — parsing agora é feito em bloco isolado, resultado armazenado em variável `parsed`
2. Adicionada função `friendlyFallback(status)` que mapeia códigos HTTP para mensagens amigáveis em português:
   - 502/503/504 → "Servidor temporariamente indisponível..."
   - 500 → "Erro interno do servidor..."
   - 404 → "Recurso não encontrado."
   - 403 → "Acesso negado."
   - 429 → "Muitas requisições..."
   - Outros → "Erro de conexão (HTTP X)"
3. Respostas HTML (não-JSON) agora nunca são expostas ao usuário — sempre usa a mensagem amigável

---

## 2026-02-12 - Limitações do Plano Gratuito (Free vs Premium)

**Arquivos modificados:**

**Backend:**
- `backend/src/modules/subscriptions/subscriptions.service.ts`
- `backend/src/modules/playlists/playlists.controller.ts`
- `backend/src/modules/playlists/playlists.module.ts`
- `backend/src/modules/catalog/catalog.controller.ts`
- `backend/src/modules/catalog/catalog.module.ts`
- `backend/src/modules/profiles/profiles.controller.ts`
- `backend/src/modules/profiles/profiles.module.ts`

**Mobile:**
- `mobile/src/context/SubscriptionContext.tsx` (NOVO)
- `mobile/src/services/api.ts`
- `mobile/App.tsx`
- `mobile/src/screens/HomeScreen.tsx`
- `mobile/src/screens/ProfilesScreen.tsx`
- `mobile/src/screens/AccountScreen.tsx`

**Descrição:** Implementadas limitações para diferenciar usuários do plano gratuito (`plano-gratuito`) de assinantes premium/cortesia.

**Alterações Backend:**
1. Adicionado método `isFreePlan(userId)` ao `SubscriptionsService`
2. Protegidos endpoints com `ForbiddenException`:
   - `POST /playlists` — criar playlist bloqueado para free
   - `POST /playlists/:id/items` — adicionar item à playlist bloqueado para free
   - `POST /works/:id/favorite` — favoritar bloqueado para free
   - `POST /profiles` — limitado a 1 perfil para free (valida contagem de perfis ativos)
3. Wiring: `SubscriptionsModule` importado nos módulos de playlists, catalog e profiles

**Alterações Mobile:**
1. Criado `SubscriptionContext.tsx`:
   - Estados: `planSlug`, `isFree`, `isPremium`, `isLoaded`
   - Cache local via AsyncStorage
   - Sincronização automática após login e ao retornar do background (AppState)
   - Não bloqueia renderização — UI usa cache, atualiza em background
2. Adicionada função `apiGetCurrentSubscription` em `api.ts`
3. `SubscriptionProvider` inserido no `App.tsx` (dentro de AuthProvider, acima de PlayerProvider)
4. `HomeScreen.tsx`:
   - Bottom nav: tabs Favoritos e Playlist removidas para free
   - Dashboard: seção Favoritos oculta para free
   - Player fullscreen: botões Playlist e Favoritar ocultos para free
5. `ProfilesScreen.tsx`: formulário "Adicionar novo perfil" oculto quando free já possui 1 perfil; texto informativo exibido
6. `AccountScreen.tsx`: seções "Reprodução" e "Reprodução da playlist" (toggles autoplay/loop) ocultas para free

---

## 2026-02-12 - Obras Premium (Preview limitado para free)

**Arquivos modificados/criados:**

**Backend:**
- `backend/src/database/migrations/1771000000000-add-is-premium-to-works.ts` (NOVO)
- `backend/src/modules/catalog/entities/work.entity.ts`

**Frontend Admin:**
- `frontend/src/services/api.ts`
- `frontend/src/app/admin/catalog/page.tsx`

**Mobile:**
- `mobile/src/context/PlayerContext.tsx`
- `mobile/src/components/DashboardCard.tsx`
- `mobile/src/components/MiniPlayer.tsx`
- `mobile/src/screens/CatalogScreen.tsx`
- `mobile/src/screens/HomeScreen.tsx`

**Descrição:** Implementado conceito de "obra premium". Obras marcadas como premium podem ser ouvidas por usuários free, porém apenas 30% da duração, com fadeout nos últimos 3 segundos.

**Alterações Backend:**
1. Migration: coluna `is_premium` (boolean, default false) na tabela `works`
2. Entity: campo `isPremium` adicionado ao `Work`

**Alterações Admin:**
1. Interface `Work`: adicionado `isPremium`
2. Formulário de criação: Switch "Obra Premium"
3. Dialog de edição: Switch "Obra Premium" + inclusão no payload de update
4. Tabela de obras: coluna "Premium" com badge dourado

**Alterações Mobile:**
1. `PlayerContext.tsx`:
   - Constantes `PREMIUM_PREVIEW_PERCENT = 0.30` e `FADEOUT_DURATION_SEC = 3`
   - Estados: `isPremiumPreview`, `premiumPreviewLimit`
   - `playTrack()`: detecta obra premium + user free → ativa preview mode
   - `onPlaybackStatusUpdate()`: fadeout gradual via `setVolumeAsync()` nos últimos 3s, stop na posição limite
   - `seekTo()`: clamp máximo em `premiumPreviewLimit`
   - `stop()`: reseta estados de premium preview
2. `DashboardCard.tsx`: badge "★ Premium" dourado sobre a cover
3. `CatalogScreen.tsx`: badge "★ Premium" dourado sobre a cover no card
4. `MiniPlayer.tsx`: estrela dourada "★" ao lado do título quando em preview
5. `HomeScreen.tsx` (player fullscreen):
   - Badge "★ PREMIUM" dourado abaixo do título
   - Timeline: zona vermelha semi-transparente da posição limite até o final
   - Thumb clamped — não pode ser arrastado além do limite

---

## 2026-02-12 - Bloqueio de perfis extras para plano free (Web + Mobile)

**Arquivos modificados:**

**Frontend Web:**
- `frontend/src/app/dashboard/profiles/page.tsx`
- `frontend/src/components/ProfileSwitcher.tsx`

**Mobile:**
- `mobile/src/screens/ProfilesScreen.tsx`

**Descrição:** Usuários free com 2+ perfis agora só podem usar o primeiro (principal). Perfis extras ficam visíveis porém bloqueados com ícone de cadeado e CTA de upgrade. Criação de novos perfis é bloqueada para free.

**Regras implementadas:**
1. **Free → bloqueia criação** de novos perfis (web + mobile)
2. **Free com 2+ perfis → somente o primeiro é utilizável**, demais ficam bloqueados
3. **Perfis bloqueados**: exibem ícone de cadeado (Lock), hint "Faça upgrade" (mobile) ou botão "Fazer upgrade" (web)
4. **ProfileSwitcher (web)**: auto-corrige para primeiro perfil se free user tinha selecionado outro; itens bloqueados ficam desabilitados no dropdown

**Alterações Web:**
1. `profiles/page.tsx`: busca subscription, calcula `isFree`, perfis com `i > 0` ficam `isLocked` (opacity + Lock icon + botão upgrade → `/dashboard/subscriptions`), seção de criação substituída por mensagem de upgrade
2. `ProfileSwitcher.tsx`: busca subscription, bloqueia seleção de perfis extras, auto-corrige perfil ativo para o primeiro se necessário

**Alterações Mobile:**
1. `ProfilesScreen.tsx`: perfis com `i > 0` quando `isFree` ficam `isLocked` (opacity 0.5, ícone Lock dourado, hint "Faça upgrade", botões edit/delete ocultados, radio desabilitado)
2. `ProfileSelectionScreen.tsx`: tela pós-login "Quem está ouvindo?" — perfis extras (além do primeiro) ficam bloqueados com cadeado dourado, hint "Faça upgrade", card dimmed. Footer muda mensagem para free users.

**Fix:** Corrigido slug do plano free de `plano-free` para `plano-gratuito` (valor real no banco de dados) nos arquivos web.

---

## 2026-02-12 - Reestruturação do menu Mais + SettingsScreen + UpgradeModal

**Arquivos criados:**
- `mobile/src/screens/SettingsScreen.tsx` — tela dedicada para configurações de reprodução (reprodução contínua, loop de playlist)
- `mobile/src/components/UpgradeModal.tsx` — modal de upgrade com lista de benefícios premium e redirecionamento externo

**Arquivos modificados:**
- `mobile/src/screens/AccountScreen.tsx` — removidos toggles de reprodução (movidos para SettingsScreen)
- `mobile/src/screens/HomeScreen.tsx` — menu "Mais" reestruturado com novos itens

**Descrição:** Refatoração da seção "Mais" do app mobile:
1. **Configurações** (apenas para premium): abre tela dedicada com opções de reprodução contínua e loop
2. **Fazer upgrade** (apenas para free): botão dourado que abre modal com benefícios e redireciona para site externo
3. **UpgradeModal**: usa padrão do ExternalLinkModal, com ícone diamond dourado, lista de 5 benefícios premium, nota de redirecionamento, e botões "Agora não" / "Ver planos"
4. **AccountScreen**: simplificada — mantém apenas dados pessoais (nome, email) e alteração de senha
5. URL de upgrade usa `siteBaseUrl` de `app.json` + `/dashboard/subscriptions`

---

## 2026-02-19 - Login Social com Apple (Backend + Mobile)

**Arquivos criados:**
- `backend/src/modules/auth/dto/apple-oauth.dto.ts` — DTO com `identityToken`, `appleUserId` e `user` (nome/email opcionais)
- `backend/src/database/migrations/1774000000000-add-apple-user-id.ts` — Migration para coluna `apple_user_id` (unique, nullable) na tabela `users`

**Arquivos modificados:**

**Backend:**
- `backend/src/modules/users/entities/user.entity.ts` — Adicionado campo `appleUserId` e `authProvider` aceita `'apple'`
- `backend/src/modules/users/users.service.ts` — `createWithPasswordHash` aceita `appleUserId`; novo método `findByAppleUserId`
- `backend/src/modules/auth/auth.service.ts` — Método `loginWithApple`: valida JWT Apple via JWKS (chaves públicas), busca usuário por `appleUserId`, cria usuário se novo, rejeita se email já existe com outro provider
- `backend/src/modules/auth/auth.controller.ts` — Endpoint `POST /auth/oauth/apple` com anti-abuse
- `backend/src/common/anti-abuse/auth-anti-abuse.guard.ts` — Action `oauth_apple` adicionada

**Mobile:**
- `mobile/app.json` — `usesAppleSignIn: true` + plugin `expo-apple-authentication`
- `mobile/src/services/api.ts` — Função `apiAppleOAuth`
- `mobile/src/context/AuthContext.tsx` — Método `appleOAuth`, tipo `authProvider` inclui `'apple'`
- `mobile/src/screens/LoginScreen.tsx` — Botão Apple nativo (iOS only), handler `handleAppleLogin`
- `mobile/src/screens/AccountScreen.tsx` — Tipo `authProvider` inclui `'apple'`

**Dependências adicionadas:**
- Backend: `jsonwebtoken`, `jwks-rsa`, `@types/jsonwebtoken`
- Mobile: `expo-apple-authentication`

**Decisões técnicas:**
- JWT Apple validado criptograficamente via JWKS (chaves públicas da Apple) ao invés de API de token info
- `apple_user_id` armazenado para logins futuros quando Apple não retorna email
- Email não encontrado → gera fictício `apple_{slug}_{timestamp}@privaterelay.appleid.com`
- Email já existente → rejeita com `ConflictException` (não vincula automaticamente)
- Botão Apple só renderiza no iOS via `AppleAuthentication.isAvailableAsync()`

---

## 2026-02-20 - Correção de Login iOS (ATS + APPLE_CLIENT_ID em Produção)

**Arquivos modificados:**
- `mobile/app.json`
- `docker-compose-prod.yml`

**Problema:**
- Login (e-mail/senha, Google e Apple) não funcionava em dispositivos iOS, enquanto no Android funcionava normalmente tanto em desenvolvimento quanto em produção.

**Causas raiz identificadas:**

1. **App Transport Security (ATS) do iOS:**
   - A `apiBaseUrl` no `app.json` estava configurada como `http://api.ninaro.com.br` (HTTP)
   - O iOS bloqueia conexões HTTP por padrão (ATS policy), diferente do Android que permite
   - Resultado: todas as requisições do app iOS para a API eram silenciosamente bloqueadas

2. **`APPLE_CLIENT_ID` ausente em produção:**
   - A variável `APPLE_CLIENT_ID` estava definida no `.env` de desenvolvimento mas NÃO era passada no `docker-compose-prod.yml`
   - Sem essa variável, a verificação de `audience` do JWT da Apple era ignorada em produção
   - Risco de segurança (aceitar tokens destinados a outro app) e potenciais falhas de validação

**Correções:**
1. `app.json`: Alterado `apiBaseUrl` de `http://` para `https://api.ninaro.com.br/api/v1`
2. `app.json`: Alterado `siteBaseUrl` de `http://` para `https://ninaro.com.br`
3. `docker-compose-prod.yml`: Adicionado `APPLE_CLIENT_ID: ${APPLE_CLIENT_ID}` nas variáveis de ambiente do service `babytune_backend`

**Resultado:**
- Login iOS compliance com ATS (HTTPS obrigatório)
- Validação de audience do Apple JWT ativa em produção
- Necessário redeploy do backend com a env `APPLE_CLIENT_ID=com.wizer.ninaro.ios`

