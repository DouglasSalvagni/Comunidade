# Pontos de atenção — Política de Privacidade e Termos de Uso (Ninaro)

Este arquivo lista tópicos que devem ser cobertos na redação dos **Termos de Uso** e da **Política de Privacidade** do Ninaro, com base nas funcionalidades e fluxos existentes no produto (web, mobile e backend). Não é o texto final dos documentos.

## 1) Contexto do produto (para enquadramento)

- Plataforma de assinatura com **catálogo de músicas e audiobooks infantis**, com conta do responsável e **perfis infantis** (web e mobile).
- Áreas: landing pública, autenticação, dashboard do usuário, player, área admin.
- Backend expõe APIs para: autenticação, perfis, catálogo, playback, playlists, assinaturas/faturas, mídia (upload/processamento), documentos legais (termos/privacidade) e admin.

Referências do projeto:
- Mapa de features: `frontend/features-backend.md:1`
- Módulos do backend: `backend/src/app.module.ts:87`
- Documentos legais versionados (estrutura): `doc/legal_documents.md:1`

## 2) Pontos para a Política de Privacidade (LGPD e privacidade por design)

### 2.1) Quem é o controlador, contatos e escopo

- Identificação do controlador (razão social/CPF/CNPJ), canal de contato e, se aplicável, encarregado (DPO).
- Canal LGPD/privacidade: `privacidade@empresa.com`.
- Escopo: app web (`frontend`), app mobile (`mobile`) e APIs (`backend`), incluindo subdomínios/CDN.
- Território e lei aplicável (ex.: Brasil/LGPD) e como tratar usuários fora do Brasil (se houver).

### 2.2) Categorias de titulares e dados tratados (adulto x criança)

- Diferenciar **dados do titular da conta** (responsável) vs **dados dos perfis infantis** (criança/adolescente).
- Dados da conta do responsável (exemplos observados no sistema):
  - Identificação e contato: `nome`, `email` (`backend/src/modules/users/entities/user.entity.ts:13`).
  - Autenticação e segurança: hash de senha, status de verificação de e-mail, tokens de recuperação/verificação (hash + expiração) (`backend/src/modules/users/entities/user.entity.ts:31`).
  - Provedor de login: local/Google (`backend/src/modules/users/entities/user.entity.ts:23`).
- Dados dos perfis infantis:
  - `name`, `avatarUrl`, `birthDate` e `parentalPin` (PIN parental) (`backend/src/modules/profiles/entities/profile.entity.ts:27`).
  - No cadastro de perfil infantil, `birthDate` é obrigatório; `parentalPin` é opcional (`backend/src/modules/profiles/dto/create-profile.dto.ts:21`).
- Dados de uso e telemetria funcional:
  - Eventos de playback (play/pause/seek/complete), posição e timestamp (`backend/src/modules/playback/entities/play-event.entity.ts:12`).
  - Downloads/offline: `deviceId` e expiração de licença por perfil/faixa (`backend/src/modules/playback/entities/download.entity.ts:13`).
- Dados financeiros/contratuais:
  - Assinatura (status, período, IDs de provedor) (`backend/src/modules/subscriptions/entities/subscription.entity.ts:13`).
  - Faturas (status, valor, vencimento, URL de pagamento, IDs do provedor) (`backend/src/modules/subscriptions/entities/invoice.entity.ts:28`).
- Dados técnicos de segurança e prevenção a abuso:
  - IP, user-agent, ASN/rede (tratados para rate-limit/antiabuso, com hash de identificadores) (`backend/src/common/anti-abuse/anti-abuse.service.ts:29`).
- Cookies/armazenamentos locais:
  - Web: cookie `accessToken` (httpOnly) e cookie `acceptedLegal` (httpOnly) (`frontend/src/app/api/auth/set-token/route.ts:11` e `backend/src/modules/auth/auth.controller.ts:88`).
  - Mobile: tokens e dados do usuário em `AsyncStorage` (`mobile/src/context/AuthContext.tsx:1`).

### 2.3) Base legal, finalidades e necessidade (tabela “dado → finalidade → base”)

Para cada categoria de dados, explicitar:
- Finalidade (ex.: criar conta, autenticar, prevenir fraude, fornecer streaming, gerenciar assinatura, enviar e-mails transacionais).
- Base legal adequada (ex.: execução de contrato, legítimo interesse, cumprimento de obrigação legal, consentimento quando aplicável).
- Justificativa de necessidade/minimização (somente o necessário para a finalidade).

Pontos de finalidade diretamente ligados ao produto:
- Prestação do serviço principal: catálogo e player (streaming e/ou offline), favoritos e playlists.
- Gestão de conta: login, verificação de e-mail, recuperação de senha, gestão de perfis.
- Cobrança/assinatura e emissão de faturas.
- Segurança: prevenção de abuso e incidentes, auditoria, conformidade.
- Atendimento: suporte ao usuário (contato e histórico quando existir).
- Comunicações:
  - E-mails transacionais: verificação e recuperação de senha, remetente `naoresponda@ninaro.com.br`.
  - Inicialmente, não há newsletter/ofertas nem push promocional; se houver e-mails de marketing no futuro, remetente planejado `marketing@ninaro.com.br` e prever opt-out (descadastro) e preferências.

### 2.4) Dados de crianças e adolescentes (tratamento reforçado)

- Regras específicas para **dados de crianças**:
  - Papel do responsável: criação e gestão de perfis infantis, consentimento/ciência conforme o desenho do produto.
  - Transparência reforçada e linguagem acessível.
  - Compromisso de minimização (ex.: uso de `birthDate` apenas para recomendação/segmentação etária).
- Explicitar se há ou não:
  - Publicidade direcionada.
  - Perfilamento automatizado com efeitos relevantes.
  - Compartilhamento para fins de marketing.
  - Publicidade apenas contextual, sem anúncios personalizados.

### 2.5) Compartilhamento com terceiros e operadores (quem recebe dados e por quê)

Listar categorias de terceiros e o que é compartilhado:
- Papéis (LGPD):
  - Controlador: Ninaro.
  - Operadores: Cloudflare (R2/CDN/segurança), Hostinger (hospedagem e e-mail), Asaas (gateway/checkout).
- Provedor de autenticação:
  - Google (login social) no web (`frontend/src/app/api/auth/[...nextauth]/route.ts:1`) e validação de token no backend (`backend/src/modules/auth/auth.service.ts:157`).
- Pagamentos/recorrência:
  - Asaas (integração e webhooks) (`backend/src/modules/subscriptions/subscriptions.module.ts:1` e `backend/src/modules/subscriptions/webhooks.controller.ts:1`).
  - O processamento de pagamentos, gestão de transações e informações de checkout são realizados no ambiente do Asaas; pela integração com instituições financeiras/redes de cartão/autenticação, pode ocorrer comunicação/transmissão de dados pessoais para fora do Brasil, observadas medidas de segurança aplicáveis e conformidade com a legislação vigente.
- Armazenamento e entrega de mídia:
  - Cloudflare R2 (S3 compatível) para upload/armazenamento e Cloudflare (CDN) para entrega.
  - Implementação: presigned upload e processamento (`backend/src/modules/media/media.service.ts:1` e `backend/src/config/s3.config.ts:1`).
  - Infraestrutura distribuída globalmente, sem seleção de local físico específico; dados podem ser armazenados/processados fora do Brasil, observadas medidas adequadas de segurança e proteção.
- Provedor de e-mail (SMTP):
  - Envio de verificação e recuperação de senha (`backend/src/modules/auth/auth.service.ts:99`).
  - Verificação e recuperação de senha usam `naoresponda@ninaro.com.br`.
- Infraestrutura/hospedagem e observabilidade:
  - Hospedagem do backend/web (Hostinger), banco (Postgres), fila/cache (Redis), logs (quando aplicável).
  - Hospedagem (VPS Hostinger): contratada explicitamente como Brasil.
  - E-mail (Hostinger): classificar como transferência internacional de dados pessoais; finalidade: comunicação corporativa; base legal: execução de contrato e legítimo interesse.

Para cada terceiro, prever:
- Papel (operador/suboperador/controlador independente).
- Localização/transferência internacional.
- Medidas contratuais e de segurança.

### 2.6) Retenção, eliminação e anonimização

- Prazo de retenção por categoria (conta, perfis, eventos de playback, faturas, logs de segurança, backups).
- Critérios de retenção (ex.: obrigação fiscal/contábil para dados de cobrança).
- Processo de exclusão:
  - Exclusão de conta e perfis (e efeito em históricos associados).
  - Exclusão/anonimização de eventos de playback e `deviceId` de downloads.
- Backups e janela de retenção (eliminação “eventual” em backups).

### 2.7) Direitos do titular (LGPD) e como exercer

- Confirmação de tratamento, acesso, correção, portabilidade, eliminação, informação sobre compartilhamento, revogação de consentimento (quando aplicável).
- Procedimento: canal, prazos, verificação de identidade.
- Quando pode haver negativa/limitação (obrigação legal, fraude, segurança).

### 2.8) Segurança da informação e boas práticas

- Medidas técnicas e organizacionais:
  - Hash de senha, tokens com expiração, cookies httpOnly, TLS, rate limiting.
  - Proteção de conteúdo (URLs assinadas e, quando aplicável, HLS/criptografia).
  - Antiabuso usa IP, user-agent e rede/ASN para limitar tentativas, mantendo contadores em memória (sem persistência em banco) (`backend/src/common/anti-abuse/anti-abuse.service.ts:29`).
  - Em desenvolvimento, o `DevExceptionFilter` pode registrar payload com metadados da requisição no console (`backend/src/common/filters/dev-exception.filter.ts:1` e `backend/src/main.ts:62`).
- Gestão de incidentes:
  - Como o usuário será notificado, prazos e critérios.

### 2.9) Cookies, SDKs, identificadores e rastreamento

- Web:
  - Cookies estritamente necessários (autenticação/aceite legal).
  - Cookies de terceiros (ex.: NextAuth/Google) se aplicável.
- Mobile:
  - Identificadores armazenados localmente, e o papel de `deviceId` para offline.
- Se existir analytics/marketing: listar eventos, SDKs e opt-out (quando aplicável).

### 2.10) Conteúdo, imagens e dados gerados por admin

- O admin pode fazer upload de mídia e imagens de capa (S3/CDN). Definir se há risco de dados pessoais em arquivos enviados e como é tratado.
- Moderação e remoção de conteúdo, quando aplicável.

## 3) Pontos para os Termos de Uso (relação contratual)

### 3.1) Definições e aceite

- Definições: “Serviço”, “Conta”, “Perfil Infantil”, “Conteúdo”, “Assinatura”, “Fatura”, “Dispositivos”.
- Aceite versionado e obrigatório:
  - Há documentos ativos por tipo (Termos/Privacidade) e aceite por versão (`doc/legal_documents.md:1`).
  - Cadastro exige aceite; renovação de termos pode permitir continuar com aviso (fluxo já previsto) (`doc/legal_documents.md:1` e `backend/src/modules/auth/auth.service.ts:60`).
- Idade mínima e responsabilidade do titular da conta:
  - Somente responsáveis adultos criam contas; o responsável declara ser maior e capaz e responsável por perfis infantis.

### 3.2) Regras de uso e condutas proibidas

- Proibições típicas relacionadas ao produto:
  - Compartilhamento indevido de credenciais.
  - Tentativa de burlar paywall/assinatura, scraping, engenharia reversa do app/player.
  - Captura/redistribuição do conteúdo (download não autorizado, cópia e republicação).
  - Abuso do sistema (tentativas de login em massa), sujeito a bloqueio/limites (há antiabuso no backend).

### 3.3) Conta, autenticação e segurança

- Responsabilidade por manter e-mail atualizado e proteger senha.
- Verificação de e-mail e restrições de acesso enquanto não verificado (no login local há bloqueio sem `emailVerified`) (`backend/src/modules/auth/auth.service.ts:38`).
- Login social (Google): condições, dependência de terceiros e suspensão/revogação.

### 3.4) Perfis infantis e controles parentais

- Regras de criação e uso de perfis infantis:
  - Finalidades do perfil e do `parentalPin`.
  - Regras de consentimento/ciência do responsável.
- Como o serviço lida com recomendação por idade (ex.: via `birthDate`/idade recomendada do catálogo).

### 3.5) Conteúdo, licenças e propriedade intelectual

- Licença de uso do conteúdo ao assinante:
  - Não exclusiva, intransferível, para consumo pessoal/familiar.
- Limitações: proibição de redistribuição, retransmissão, exibição pública, extração e venda.
- Disponibilidade: catálogo pode mudar (remoção/substituição de obras).
- Direitos de marca, app, UI, API e materiais promocionais.

### 3.6) Assinatura, cobrança, cancelamento e reembolsos

- O serviço pode iniciar gratuito, com possível introdução futura de recursos premium por assinatura.
- Planos, periodicidade, valores, reajustes e formas de pagamento.
- Intermediação de pagamento (gateway): responsabilidades e comunicação de falhas.
- Canal de compra: assinatura fora das lojas (ex.: checkout/gateway como Asaas).
- Comunicação de cobrança/assinatura:
  - Pode ocorrer envio por endereços `@asaas.com` (ex.: `cobrancas+876778@asaas.com`), mas o mais provável é não haver e-mails de cobrança.
- Cancelamento e efeitos:
  - Fim do período vigente, encerramento de acesso, tratamento de faturas pendentes.
- Política de reembolso/arrependimento (adequar ao CDC e ao canal de compra: web/lojas).
- Trial/cupom/parcerias/afiliados (há entidades e endpoints relacionados no backend) (`backend/src/modules/subscriptions/subscriptions.module.ts:1`).

### 3.7) Offline/downloads (se disponibilizado)

- Regras de licença temporária e expiração de downloads.
- Limites por dispositivo e vinculação por `deviceId` (o backend modela `deviceId` em downloads) (`backend/src/modules/playback/entities/download.entity.ts:13`).
- Consequências de reinstalação/limpeza de dados no dispositivo.

### 3.8) Disponibilidade, limitações técnicas e suporte

- Dependências de internet para streaming, qualidade variável, indisponibilidade temporária.
- Manutenções, atualizações e mudanças de requisitos técnicos (web/mobile).
- Canal de suporte, prazos e escopo (SLA, se houver).

### 3.9) Suspensão/encerramento e moderação

- Hipóteses de suspensão/encerramento: violação de termos, fraude, abuso, chargeback, exigência legal.
- Consequência no acesso ao conteúdo e em dados associados.

### 3.10) Responsabilidade civil e limitações

- Limites de responsabilidade (na medida permitida):
  - Indisponibilidade, falhas de terceiros (Google, gateway, CDN), perdas indiretas.
- Obrigações do usuário (uso adequado, dispositivos compatíveis).

### 3.11) Alterações dos documentos

- Como avisar mudanças (no produto já existe mecanismo de “documentos ativos” e reaceite).
- Quando a mudança entra em vigor e como o usuário pode cancelar/excluir conta se discordar.

### 3.12) Foro e resolução de disputas

- Lei aplicável e foro/competência.
- Alternativas: atendimento, mediação/consumidor.gov, arbitragem (se fizer sentido).

## 4) Pontos transversais (o que precisa ser decidido antes da redação)

### 4.2) Decisões pendentes (definir antes de “fechar” a redação)

- Logs e retenção:
  - Definir política de retenção e acesso aos logs no provedor de hospedagem (Hostinger) e controles internos.
  - Especificar quais dados podem constar nos logs técnicos/auditoria (ex.: `user_id` quando autenticado, `ip`, `user_agent`, método, rota/path, `status_code`, duração, identificadores de correlação e nome do erro).
  - Declarar finalidades dos logs (segurança, prevenção/detecção de fraude e abuso, auditoria/rastreabilidade, diagnóstico de falhas e conformidade).
  - Indicar base legal aplicável para logs de segurança/auditoria (em geral legítimo interesse e/ou cumprimento de obrigação legal/exercício regular de direitos, conforme o caso).
  - Garantir minimização: logs de auditoria devem registrar metadados técnicos e não conteúdo sensível (ex.: senha, token, dados de pagamento) ou conteúdo do usuário; prever controles para evitar inclusão indevida.
  - Definir prazos de retenção (por tipo de log) e critérios de extensão (ex.: investigação de incidente, obrigação legal), além de política de expurgo/anonymização ao final.
  - Definir quem acessa os logs e sob quais controles (princípio da necessidade, perfis autorizados, trilha de auditoria de acessos administrativos quando aplicável).
  - Definir regras de compartilhamento (operadores/infraestrutura e autoridades) e em quais hipóteses os logs podem ser utilizados/fornecidos.
  - Definir medidas de segurança e segregação (ambientes, backups, acesso restrito) e o tratamento de incidentes envolvendo logs.

