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
