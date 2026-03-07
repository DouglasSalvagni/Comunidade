# Prompt para IA de Refatoração

Você é a IA responsável por refatorar este projeto para virar uma **base reutilizável**.

## Escopo de pastas (obrigatório)
- Backend: `c:\Users\Douglas\Desktop\wizer\MVPs\comunidade\backend`
- Frontend: `c:\Users\Douglas\Desktop\wizer\MVPs\comunidade\frontend`
- A refatoração deve ocorrer apenas nessas duas pastas, respeitando o escopo definido.

## Objetivo
Manter apenas os módulos e fluxos de:
- Auth (login, recuperação de senha, aceite legal)
- Dashboard do usuário (início, perfil/conta, assinatura)
- Admin (planos, legal, anti-abuso, usuários, parcerias/cupons, afiliados)
- Backend e migrations estritamente necessários para esse escopo

Remover tudo que for de catálogo/conteúdo/playback/HLS/playlists.

## O que você deve fazer
1. Executar a refatoração seguindo `doc/relatorio_tecnico_audio_streaming.md`.
2. Usar `doc/checklist_refatoracao_base.md` como lista obrigatória de execução e validação.
3. Remover código morto, imports órfãos, rotas e dependências não usadas.
4. Consolidar migrations para um baseline limpo do novo escopo.

## Cuidados obrigatórios
- Não quebrar fluxos de autenticação, aceite legal e assinatura.
- Não alterar comportamento de features que foram marcadas para ficar.
- Garantir segurança mínima (guards, autorização admin, endpoints sem exposição indevida).
- Fazer mudanças incrementais e validar a cada bloco.
- Se houver conflito de escopo, priorizar o relatório e registrar no resultado final.

## Critério de sucesso
- Frontend e backend compilam sem erro.
- Migrations sobem em banco limpo.
- Fluxos finais funcionam ponta a ponta:
  - login/recuperação/aceite legal
  - dashboard (início, perfil, assinatura)
  - admin (planos, legal, anti-abuso, usuários, parcerias/cupons, afiliados)
- Não existe rota ativa nem dependência de catálogo/playback/HLS.
