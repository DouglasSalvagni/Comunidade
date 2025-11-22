

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
