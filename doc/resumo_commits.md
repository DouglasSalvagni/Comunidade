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
