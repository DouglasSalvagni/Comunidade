# Mapa de Features para Desenvolvimento de Backend

## Visão Geral
- Plataforma infantil com catálogo de músicas e audiobooks.
- Áreas: Público (landing), Autenticação, Dashboard do usuário, Player, Admin.

## Autenticação
- Login de usuário (email/senha) `src/app/auth/login/page.tsx:7`.
- Cadastro de usuário `src/app/auth/register/page.tsx:7`.
- Login de administrador `src/app/admin/login/page.tsx:8`.

## Dashboard do Usuário
- Início com favoritos e atalhos `src/app/dashboard/page.tsx:12`.
- Catálogo com busca, filtros por tipo, idade e tags; favoritar; ação “Adicionar à playlist” `src/app/dashboard/catalog/page.tsx:30`.
- Playback com player fixo e playlist local `src/app/dashboard/playback/page.tsx:3`.
- Gestão de perfis infantis: listar, adicionar, editar, excluir `src/app/dashboard/profiles/page.tsx:9`.
- Assinatura: visualizar plano atual, trocar plano, histórico de cobrança `src/app/dashboard/subscriptions/page.tsx:6`.
- Troca rápida de perfil ativo no cabeçalho `src/components/ProfileSwitcher.tsx:16`.

## Player de Áudio
- Player fixo com controle de faixa, próxima/anterior, volume/mute, playlist com mover para cima/baixo e remover `src/components/AudioPlayer.tsx:13`.
- Altura do player aplicada ao layout para evitar sobreposição `src/app/layout.tsx:24` e `src/context/PlayerHeightContext.tsx:12`.

## Administração (Super Admin)
- Dashboard com navegação para módulos `src/app/admin/page.tsx:4` e `src/app/admin/layout.tsx:5`.
- Catálogo: adicionar obra (título, descrição, tipo, idade, tags, upload de arquivo e thumbnail), listar, buscar, paginação, alternar status ativo/inativo, editar, remover `src/app/admin/catalog/page.tsx:15`.
- Tags: listar, adicionar, editar, remover `src/app/admin/tags/page.tsx:11`.
- Usuários: listar, buscar por nome/email, alternar status ativo/inativo, ver detalhes `src/app/admin/users/page.tsx:12`.

## Modelos de Dados (referência)
- Tag, Track, Chapter, Work (music|audiobook|series, recommendedAge, tags, coverUrl, isFavorite, tracks/chapters), Series, Profile `src/lib/types.ts:1`.
- Dados mockados para UI: tags, works, series, profiles `src/lib/mock-data.ts:3`.

## Requisitos Mínimos de Backend (derivados das telas)
- Autenticação de usuários: registrar, login, manutenção de sessão.
- Autenticação de admin.
- Catálogo de obras: CRUD, busca e filtros (tipo, idade, tags), paginação.
- Upload/armazenamento de mídia (áudio) e imagem (thumbnail/capa).
- Tags: CRUD e associação com obras.
- Favoritos do usuário por obra.
- Perfis infantis do usuário: CRUD.
- Assinaturas: obter plano atual, trocar plano, histórico de cobranças, cancelar.
- Streaming/serving de faixas/chapters e metadados de playlist (se houver persistência).

## Observações
- A UI usa estado local e dados mock; o backend deve expor APIs para substituir esses dados e acionar as ações listadas.
- Endpoints e contratos podem ser definidos a partir destes módulos; recomenda-se padronizar paginação e filtros via query params.