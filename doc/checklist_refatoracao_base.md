# Checklist de Refatoração — Base Reutilizável

## 0) Preparação
- [ ] Criar branch exclusiva para a refatoração da base.
- [ ] Congelar merge de features novas durante a limpeza.
- [ ] Confirmar escopo final de **FICAR** e **REMOVER** do relatório.
- [ ] Salvar snapshot do banco atual para rollback.

## 1) Frontend — Manter apenas o escopo alvo

### 1.1 Rotas que devem permanecer
- [ ] Validar funcionamento de `/admin/plans`.
- [ ] Validar funcionamento de `/admin/legal`.
- [ ] Validar funcionamento de `/admin/anti-abuse`.
- [ ] Validar funcionamento de `/admin/users`.
- [ ] Validar funcionamento de `/admin/partnerships`.
- [ ] Validar funcionamento de `/admin/affiliates`.
- [ ] Validar funcionamento de `/dashboard`.
- [ ] Validar funcionamento de `/dashboard/account`.
- [ ] Validar funcionamento de `/dashboard/subscriptions`.
- [ ] Validar funcionamento de `/auth/login`.
- [ ] Validar funcionamento de `/auth/forgot`.
- [ ] Validar funcionamento de `/auth/reset`.
- [ ] Validar funcionamento de `/auth/legal`.
- [ ] Validar funcionamento da landing `/`.

### 1.2 Rotas e telas a remover
- [ ] Remover `/admin/catalog`.
- [ ] Remover `/admin/tags`.
- [ ] Remover `/admin/dev-themes`.
- [ ] Remover `/dashboard/catalog`.
- [ ] Remover `/dashboard/playback`.
- [ ] Remover `/dashboard/profiles`.

### 1.3 Componentes e integrações a remover
- [ ] Remover `AudioPlayer` e componentes auxiliares de playback.
- [ ] Remover dependência `hls.js` do frontend.
- [ ] Remover uso de `window.__player_playTrack`.
- [ ] Remover uso de `window.__player_addTrack`.
- [ ] Remover chamadas no `api.ts` ligadas a works/tracks/playback/playlists/media de áudio.

## 2) Backend — Limpeza por módulos

### 2.1 Módulos que devem permanecer ativos
- [ ] Garantir `AuthModule` ativo e funcional.
- [ ] Garantir `UsersModule` ativo e funcional.
- [ ] Garantir `LegalModule` ativo e funcional.
- [ ] Garantir `SubscriptionsModule` ativo e funcional.
- [ ] Garantir `AdminModule` ativo e funcional.
- [ ] Garantir `SettingsModule` ativo quando necessário para admin/assinaturas.

### 2.2 Módulos a remover
- [ ] Remover `CatalogModule`.
- [ ] Remover `PlaybackModule`.
- [ ] Remover `MediaModule`.
- [ ] Remover `PlaylistsModule`.
- [ ] Remover workers de transcodificação HLS.
- [ ] Remover processamento de `play-events`.

### 2.3 Ajustes estruturais após remoção
- [ ] Limpar imports e providers no `AppModule`.
- [ ] Limpar controllers e services órfãos.
- [ ] Limpar entidades/repositórios do domínio de conteúdo/reprodução.
- [ ] Limpar variáveis de ambiente exclusivas de streaming/HLS.

## 3) Banco de dados e migrations

### 3.1 Migrations para manter (escopo base)
- [ ] Preservar migrations de auth (provider, reset, email verification).
- [ ] Preservar migrations de assinatura (planos, faturas, webhooks, metas).
- [ ] Preservar migrations de legal (documentos e aceite).
- [ ] Preservar migrations de afiliados/parcerias/cupons.
- [ ] Preservar migrations de auditoria e settings (quando usadas).

### 3.2 Migrations candidatas a remoção
- [ ] Remover migrations ligadas a tracks/HLS.
- [ ] Remover migrations ligadas a playlists/favoritos de conteúdo.
- [ ] Remover migrations de estatísticas de play.
- [ ] Remover migrations de temas/dev themes/samples de landing de conteúdo.
- [ ] Remover migrations ligadas a campos de works.

### 3.3 Tratamento da migration inicial
- [ ] Criar nova migration inicial contendo apenas domínio final (auth/users/legal/subscriptions/admin).
- [ ] Reaplicar migrations complementares compatíveis.
- [ ] Descontinuar tronco de migrations de conteúdo/playback.
- [ ] Validar criação do schema completo em banco limpo.

## 4) Dependências e infraestrutura
- [ ] Remover bibliotecas de frontend exclusivas de playback/HLS.
- [ ] Remover dependências backend exclusivas de transcodificação/playback.
- [ ] Revisar `docker-compose` para retirar serviços não necessários à base.
- [ ] Revisar `.env` e `.env.example` removendo variáveis órfãs.

## 5) Segurança e governança
- [ ] Garantir que auth/legal bloqueie uso sem aceite de termos.
- [ ] Manter guards e regras de autorização de admin.
- [ ] Manter trilha de auditoria para ações administrativas.
- [ ] Validar superfícies de API para evitar endpoints órfãos expostos.

## 6) Validação técnica obrigatória
- [ ] Rodar lint do frontend e corrigir problemas.
- [ ] Rodar typecheck do frontend e corrigir problemas.
- [ ] Rodar build do frontend com sucesso.
- [ ] Rodar lint do backend e corrigir problemas.
- [ ] Rodar typecheck/build do backend com sucesso.
- [ ] Rodar migrations em banco limpo com sucesso.
- [ ] Executar smoke test dos fluxos críticos.

## 7) Smoke test funcional (escopo final)

### 7.1 Usuário final
- [ ] Login funcional.
- [ ] Recuperação de senha funcional.
- [ ] Fluxo de aceite legal funcional.
- [ ] Dashboard inicial funcional.
- [ ] Meu perfil/conta funcional.
- [ ] Gestão de assinatura funcional.

### 7.2 Admin
- [ ] Gestão de planos funcional.
- [ ] Gestão de legal (termos/privacidade) funcional.
- [ ] Área de anti-abuso funcional.
- [ ] Gestão de usuários funcional.
- [ ] Gestão de parcerias/cupons funcional.
- [ ] Gestão de afiliados funcional.

## 8) Critérios de pronto da base
- [ ] Não existe rota ativa de catálogo/playback/HLS.
- [ ] Não existe dependência ativa de `hls.js`.
- [ ] Não existe worker ativo de transcodificação.
- [ ] Não existem tabelas órfãs de conteúdo/reprodução no schema final.
- [ ] Frontend e backend compilam sem imports mortos.
- [ ] Fluxos do escopo final passam de ponta a ponta.
