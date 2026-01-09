# Política de Privacidade — Ninaro

**Última atualização:** \[PREENCHER]  
**Versão:** \[PREENCHER]

Este documento descreve como o Ninaro (“**Ninaro**”, “**nós**”) trata dados pessoais no contexto do acesso e uso do nosso serviço (web, aplicativo mobile e APIs), em conformidade com a Lei Geral de Proteção de Dados Pessoais — **LGPD** (Lei nº 13.709/2018), sem prejuízo de outras normas aplicáveis.

## 1. Campos para publicação (preencher antes de usar em produção)

- **Controlador:** \[RAZÃO SOCIAL / NOME], \[CNPJ/CPF]  
- **Endereço:** \[ENDEREÇO COMPLETO]  
- **E-mail de privacidade (LGPD):** \[E-MAIL]  
- **E-mail de suporte:** \[E-MAIL]  
- **Encarregado/DPO (se aplicável):** \[NOME E CONTATO]  
- **Site:** \[URL]  

## 2. Escopo e definições

### 2.1. Escopo

Esta Política se aplica ao tratamento de dados pessoais realizado:

- No site e aplicativo web do Ninaro (incluindo páginas públicas, autenticação, dashboard e área administrativa).
- No aplicativo mobile do Ninaro.
- Nas APIs e demais serviços de backend do Ninaro.
- Na infraestrutura associada (por exemplo: hospedagem, CDN e e-mail transacional).

### 2.2. Definições

- **Titular:** pessoa natural a quem se referem os dados pessoais (por exemplo, o responsável titular da conta e, quando aplicável, a criança vinculada a um perfil).
- **Conta:** cadastro do responsável (adulto) que acessa o Ninaro.
- **Perfil Infantil:** perfil criado dentro da conta para uso por criança/adolescente.
- **Conteúdo:** músicas, audiobooks e demais mídias disponibilizadas no catálogo.
- **Tratamento:** qualquer operação com dados pessoais, como coleta, uso, armazenamento, compartilhamento e exclusão.
- **Controlador / Operador:** conforme a LGPD.

## 3. Quem é o controlador e como falar conosco

O Ninaro é o **controlador** dos dados pessoais tratados no âmbito do Serviço.  
Para assuntos de privacidade e LGPD, use o canal: **\[E-MAIL DE PRIVACIDADE]**.

## 4. Quais dados pessoais tratamos

O Ninaro foi desenhado para ser usado por um **responsável adulto** que gerencia **perfis infantis**. Por isso, distinguimos os dados do titular da conta e os dados do perfil infantil.

### 4.1. Dados do titular da conta (responsável)

- **Identificação e contato:** nome, e-mail.
- **Autenticação e segurança:** hash de senha (quando login local), status de verificação de e-mail, tokens de verificação e recuperação de senha (armazenados como hash e com expiração), registros de aceites de documentos legais (versão e data).
- **Gestão de conta:** status de conta ativa/inativa e papel (usuário/admin).

### 4.2. Dados de perfis infantis

- **Dados do perfil:** nome, avatar (URL), data de nascimento.
- **Controle parental:** PIN parental (quando configurado).

### 4.3. Dados de uso do serviço (telemetria funcional)

- **Eventos de reprodução:** ações como play/pause/seek/complete, posição aproximada (segundos) e data/hora.
- **Preferências e organização:** favoritos e playlists (associados à conta e/ou ao perfil, conforme a funcionalidade).

### 4.4. Dados para downloads/offline (quando disponível)

- **Identificador de dispositivo (`deviceId`):** usado para vincular licenças de download/offline e controlar expiração.
- **Licença de download:** data de criação e expiração da licença por faixa/perfil/dispositivo.

### 4.5. Dados de cobrança e assinatura

O Ninaro pode oferecer planos e cobrança recorrente via provedores de pagamento.

- **Assinatura:** status, período de vigência, e identificadores do provedor.
- **Faturas:** status, valor, vencimento, URL de pagamento e identificadores do provedor.

O Ninaro procura **minimizar** os dados financeiros tratados diretamente. Dados sensíveis de pagamento (por exemplo: dados completos de cartão) tendem a ser tratados no ambiente do provedor de pagamento, conforme as políticas do próprio provedor.

### 4.6. Dados de atendimento e comunicações

- **Comunicações transacionais:** envio de e-mails para verificação de e-mail, recuperação de senha, avisos operacionais e suporte.
- **Suporte:** informações que você enviar ao entrar em contato conosco (por exemplo: mensagem, anexos e histórico do atendimento, quando existir).

### 4.7. Dados técnicos e de segurança

- **Logs e metadados técnicos:** IP, user-agent, data/hora, registros de erro e eventos de segurança, inclusive para prevenção a fraude/abuso e estabilidade do serviço.
- **Dados de rede:** quando disponíveis, informações agregadas como ASN/rede (por exemplo, para rate limiting e mitigação de abuso).

## 5. Como coletamos os dados

Coletamos dados pessoais por:

- **Informações fornecidas por você** (cadastro, login, criação de perfis, configurações, suporte).
- **Coleta automática** (cookies estritamente necessários, logs e registros técnicos de uso e segurança).
- **Terceiros** quando você usa recursos integrados, como:
  - Login social (Google).
  - Pagamento/checkout (provedor de pagamento).

## 6. Para que usamos os dados e qual a base legal (LGPD)

As principais finalidades e bases legais incluem:

| Categoria | Finalidade | Base legal (exemplos) |
|---|---|---|
| Conta do responsável | Criar conta, autenticar, manter sessão, recuperar acesso | Execução de contrato; legítimo interesse (segurança) |
| Verificação de e-mail | Confirmar identidade do e-mail e reduzir fraudes | Execução de contrato; legítimo interesse |
| Perfis infantis | Permitir personalização e segmentação etária apropriada | Execução de contrato; legítimo interesse; proteção do titular (criança), quando aplicável |
| Eventos de reprodução | Entregar funcionalidades do player, continuidade de reprodução, estatísticas operacionais | Execução de contrato; legítimo interesse |
| Downloads/offline | Vincular licença a dispositivo e controlar expiração | Execução de contrato; legítimo interesse |
| Assinatura e faturas | Cobrança, gestão de planos, emissão/controle de faturas | Execução de contrato; cumprimento de obrigação legal/regulatória |
| Prevenção a abuso e segurança | Detecção/prevenção de fraude, incidentes e uso indevido | Legítimo interesse; cumprimento de obrigação legal |
| Comunicações transacionais | Enviar e-mails necessários ao serviço | Execução de contrato; legítimo interesse |
| Marketing (se habilitado) | Enviar novidades e ofertas | Consentimento ou legítimo interesse, conforme o caso, com opt-out |

Quando a base legal for **consentimento**, você poderá revogá-lo a qualquer tempo, nos termos da LGPD, sem afetar tratamentos anteriores realizados com base no consentimento válido.

## 7. Dados de crianças e adolescentes

O Ninaro é voltado ao público infantil quanto ao conteúdo, mas a **conta deve ser criada e gerida por um responsável adulto**.

- Você declara que é **maior de 18 anos** (ou legalmente capaz) e que possui legitimidade para criar e gerenciar perfis infantis.
- Tratamos dados de perfis infantis com **minimização** e finalidades compatíveis com a experiência e segurança do serviço.
- Não realizamos (ou, se vier a existir, informaremos de forma destacada) práticas como **publicidade comportamental dirigida a crianças** ou **venda de dados pessoais**.

## 8. Cookies, armazenamento local e tecnologias semelhantes

### 8.1. Web (cookies e armazenamento local)

O Ninaro pode utilizar:

- **Cookies estritamente necessários** para autenticação e segurança (por exemplo, cookie de sessão/autenticação) e registro do estado de aceite de documentos legais.
- **Cookies de terceiros** quando você utiliza login social (por exemplo, serviços do Google/NextAuth), sujeitos às políticas do respectivo terceiro.
- **Armazenamento local** do navegador para preferências e estado do player (por exemplo, seleção de perfil ativo), quando aplicável.

### 8.2. Mobile (armazenamento local)

O aplicativo mobile pode armazenar localmente:

- Token de acesso/sessão e informações básicas para manter login.
- Preferências do usuário e seleção de perfil.
- Identificadores técnicos (por exemplo, `deviceId`) para recursos de download/offline.

Você pode remover esses dados desinstalando o aplicativo ou limpando o armazenamento do app, observadas as limitações e consequências para funcionalidades offline.

## 9. Compartilhamento de dados com terceiros

Podemos compartilhar dados pessoais com terceiros nas seguintes hipóteses:

### 9.1. Operadores e provedores de infraestrutura (exemplos)

- **Hospedagem e infraestrutura** (servidores, banco de dados, cache/fila, monitoramento e logs).
- **Entrega e armazenamento de mídia (CDN/armazenamento compatível S3)** para disponibilização do conteúdo.
- **Serviços de e-mail** para envio de mensagens transacionais (verificação de e-mail, recuperação de senha e suporte).

### 9.2. Autenticação (login social)

Se você optar por login social, dados como e-mail e informações de perfil podem ser compartilhados/recebidos do provedor (por exemplo, Google), conforme a autorização e políticas desse provedor.

### 9.3. Pagamentos e cobrança

Quando houver cobrança por assinatura, utilizaremos provedores de pagamento/checkout para:

- Processar pagamentos, gerar cobranças e administrar transações.
- Tratar dados necessários para prevenção de fraude, conformidade e suporte a pagamentos.

O provedor de pagamento pode atuar como **controlador independente** para certos tratamentos necessários à execução da transação e à conformidade regulatória. Consulte também a política do respectivo provedor.

### 9.4. Obrigações legais e proteção de direitos

Poderemos compartilhar dados para:

- Cumprir obrigação legal, regulatória ou ordem judicial/administrativa.
- Proteger direitos, segurança e integridade do Ninaro, usuários e terceiros.

### 9.5. Parceiros (afiliados e parcerias)

Se houver uso de **cupons**, **parcerias** ou **afiliações**, poderemos tratar dados mínimos para atribuição, prevenção de fraude, auditoria e repasse, sempre limitado ao necessário e conforme a LGPD.

## 10. Transferência internacional de dados

Alguns fornecedores podem operar infraestrutura distribuída globalmente. Assim, dados podem ser armazenados ou processados fora do Brasil, conforme:

- A necessidade de execução dos serviços contratados (CDN, e-mail, autenticação, pagamentos).
- Medidas técnicas e contratuais adequadas para proteção dos dados pessoais, nos termos da LGPD.

## 11. Retenção e eliminação de dados

Reteremos dados pessoais **pelo tempo necessário** para cumprir as finalidades descritas nesta Política, incluindo cumprimento de obrigações legais e proteção de direitos. Em linhas gerais:

- **Conta e perfis:** enquanto sua conta estiver ativa e pelo período necessário para cumprir obrigações e resolver disputas.
- **Dados de cobrança/faturas:** pelo prazo exigido por obrigações legais/contábeis e para defesa de direitos.
- **Logs de segurança e prevenção a abuso:** por período razoável e proporcional para investigação e mitigação de incidentes.
- **Eventos de reprodução e dados operacionais:** pelo tempo necessário para funcionalidades do serviço e melhorias, com possibilidade de anonimização/agrupamento quando aplicável.
- **Backups:** podem persistir por janelas adicionais até expiração do ciclo de backup.

Ao solicitar exclusão, alguns dados poderão ser mantidos quando houver **base legal** para retenção (por exemplo, cumprimento de obrigação legal ou exercício regular de direitos).

## 12. Direitos do titular (LGPD)

Nos termos da LGPD, você poderá solicitar:

- Confirmação da existência de tratamento.
- Acesso aos dados.
- Correção de dados incompletos, inexatos ou desatualizados.
- Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos (quando aplicável).
- Portabilidade (quando aplicável).
- Informação sobre compartilhamento.
- Revogação do consentimento (quando aplicável).
- Oposição ao tratamento baseado em legítimo interesse (quando aplicável).

Para exercer seus direitos, envie solicitação para **\[E-MAIL DE PRIVACIDADE]**, com informações suficientes para verificação de identidade e escopo do pedido.

## 13. Segurança da informação

Adotamos medidas técnicas e organizacionais razoáveis para proteger dados pessoais, incluindo:

- Controles de autenticação, cookies de sessão com atributos de segurança, uso de criptografia em trânsito (TLS/HTTPS).
- Hash de senhas e tokens com expiração.
- Mecanismos de prevenção a abuso e monitoramento.
- Controles de acesso internos e segregação de responsabilidades.

Apesar dos melhores esforços, nenhum sistema é absolutamente seguro. Em caso de incidentes relevantes, adotaremos medidas de contenção, investigação e comunicação conforme exigido por lei e boas práticas.

## 14. Alterações desta Política

Podemos atualizar esta Política periodicamente. Quando a atualização impactar de forma relevante o tratamento de dados, poderemos solicitar um **novo aceite** no aplicativo/site.

## 15. Contato

Para dúvidas, solicitações ou reclamações sobre privacidade e dados pessoais, fale conosco:

- **Privacidade/LGPD:** \[E-MAIL DE PRIVACIDADE]  
- **Suporte:** \[E-MAIL DE SUPORTE]

