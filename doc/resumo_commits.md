

Página de Conta no mobile (editar nome e senha condicional).

- Criada `AccountScreen` com edição de nome e visualização de e-mail (somente leitura). Alteração de senha disponível apenas para `authProvider=local`; para login social (Google), exibe aviso e oculta formulário (mobile/src/screens/AccountScreen.tsx).
- Adicionados métodos de API: `PATCH /auth/profile` e `PATCH /auth/profile/password` no cliente mobile (`mobile/src/services/api.ts`).
- Estendido `AuthContext` para incluir `authProvider` e método `refreshProfile` para recarregar dados após alterações (mobile/src/context/AuthContext.tsx).
- Integrado item "Conta" no menu de Configurações da Home; navega para a nova tela e botão "Voltar" retorna ao menu (mobile/src/screens/HomeScreen.tsx).
- Checagem de tipos executada em `mobile/`: `npx tsc --noEmit` sem erros.
- Ajuste visual do e-mail na tela de Conta: campo de e-mail com opacidade reduzida para comunicar claramente que é não editável (mobile/src/screens/AccountScreen.tsx).
- Validação de senha nova alinhada ao backend/web: exige confirmação igual e mínimo de 6 caracteres antes de habilitar o envio (mobile/src/screens/AccountScreen.tsx; backend/src/modules/auth/dto/change-password.dto.ts:11).
