# Resumo de Commits / Atividades

## 2026-03-09

### Relatório e Checklist White Label
- Análise completa do backend (NestJS) e frontend (Next.js) do projeto Comunidade
- Criado `doc/relatorio_white_label.md`: relatório técnico identificando todos os itens hardcoded (nome, logos, cores, textos), o que já é configurável via variável de ambiente ou banco de dados, e o que ainda precisa ser externalizado para tornar a plataforma white label
- Criado `doc/checklist_white_label.md`: checklist com 42 tarefas priorizadas em Alta / Média / Baixa — cobrindo identidade de marca no app/dashboard, design system dinâmico, SEO, e-mails transacionais, painel admin e suporte multi-tenant

### Revisão de Escopo — Landing Page fora do White Label
- Removidos do relatório e checklist todos os itens referentes à Landing Page (`components/inspira/*`, `components/Hero`, `components/Navbar`, `components/Footer`, `components/Pricing`, `components/Benefits`, `app/page.tsx`), pois a LP é sempre um projeto separado em subdomínio próprio e não faz parte do produto white label
