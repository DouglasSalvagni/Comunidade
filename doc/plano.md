# Plano de Arquitetura — App de Assinatura de Músicas & Audiobooks Infantis

> Documento vivo. Versão 0.1 — **decisões registradas** e próximos passos.

## 1) Objetivo do Produto

Plataforma de assinatura com catálogo curado de **músicas e audiobooks infantis**, com experiência segura para crianças e ferramentas de controle para responsáveis (perfis, faixa etária, histórico e limites).

---

## 2) Pilhas & Decisões (registradas)

### Clientes

* **Web**: **Next.js** (SSR/SSG, imagens, roteamento, otimizações).
* **Mobile**: **React Native (Expo)**.

### Backend

* **Runtime**: **Node.js**
* **Framework**: **NestJS** (Fastify opcional como adapter) em **um serviço único** (monólito modular).
* **Módulos do domínio**:

  * **Auth & Perfis** — conta dos pais, perfis de criança, faixas etárias/controles.
  * **Catálogo** — obras, faixas, capítulos, séries, idade recomendada, tags/temas.
  * **Playback** — geração de URL de streaming, DRM leve/assinaturas, progresso.
  * **Assinaturas/Billing** — planos, ciclo, cobrança, webhooks do provedor de pagamento.
  * **Downloads Offline** — licenças temporárias, criptografia local, expiração/renovação.
  * **Notificações** — push (FCM/APNs/Expo) e e-mail.

### Dados & Cache

* **Banco principal**: **Postgres**.
* **Cache/Mensageria leve**: **Redis** (cache de catálogo, throttling, feature flags, filas BullMQ).

### Mídia & CDN

* **Armazenamento de mídia**: **S3 compatível** (AWS S3 / Wasabi / Backblaze B2).
* **Entrega**: **CDN** (CloudFront ou Cloudflare CDN).

### Infraestrutura

* **Orquestração**: **Docker** em **VPS**.
* **Reverse Proxy**: Nginx ou Caddy (TLS/HTTP3/HTTP2).
* **Observabilidade**: logs estruturados, métricas, tracing (**OpenTelemetry**).
* **CI/CD**: pipeline de build e deploy (GitHub Actions/Drone), versões imutáveis de imagem.
* **Backups**: snapshots do Postgres (diário) + replicação; versionamento no bucket de mídia.

---

## 3) Estratégia de Mídia
<!--  não vamos optar por esse
### Caminho A — MVP rápido (início)

* **Formato**: manter **MP3** original.
* **Entrega**: **download progressivo** via HTTP Range (206).
* **Proteção**: URLs assinadas de curta duração na CDN/proxy.
* **Players**: HTMLAudio/hls.js fallback (web), `react-native-track-player` ou `expo-av` (mobile).
* **Quando migrar**: ao precisar de ABR (qualidade adaptativa), melhor seek, proteção extra ou analytics por segmento. -->

### Caminho oficial — Qualidade/escala “igual aos grandes”

* **Transcodar** para **AAC** nas variantes **64/96/128/192/256 kbps**.
* **Empacotar** em **HLS** com **segments de 2–4s** e **master.m3u8** (ABR).
* **Proteção**: **URLs assinadas** + **criptografia HLS (AES-128)** com endpoint de chave autenticado.
* **Pipeline**: Worker (Node + FFmpeg) consumindo fila BullMQ → grava em S3 → serve via CDN.

> **Decisão de faseamento**: **Começar no Caminho A**, preparar **pipeline de ingestão** para ativar o **Caminho B** sem migrar clientes.

---

## 4) Arquitetura Lógica (alto nível)

```
[Next.js] ─┐
           ├──(HTTP/HTTPS)──> [API NestJS] ──> [Postgres]
[RN Expo] ─┘                     │  │
                                 │  ├──> [Redis] (cache/filas)
                         (S3 Presigned Upload)
                                 │
                          [Bucket S3 compatível] ──> [CDN]
                                 │
                         [Worker FFmpeg (Docker)]
                                 │
                          [BullMQ / Redis Queue]
```

**Rotas críticas**

* `POST /upload-url` → URL pré-assinada S3
* `POST /ingest` → cria job de transcodificação (Caminho B)
* `POST /playback-url` → retorna URL assinada do `.m3u8` ou do arquivo MP3 (Caminho A)
* `GET /hls-key` → entrega chave AES após validar token/assinatura (Caminho B)

---

## 5) Esquema inicial de dados (rascunho)

* **users**(id, email, senha_hash/SSO, created_at)
* **profiles**(id, user_id, nome, faixa_etaria, avatar, pin_parental)
* **works**(id, tipo: music|audiobook, título, série, idade_min, tags[], capa_url)
* **tracks**(id, work_id, título, duração, ordem, storage_key)
* **chapters**(id, work_id|track_id, título, start_ms, ordem)
* **subscriptions**(id, user_id, plano_id, status, current_period_end, provider, provider_customer_id)
* **plans**(id, nome, preço, periodicidade)
* **downloads**(id, profile_id, track_id, licença_expira_em, device_id)
* **play_events**(id, profile_id, track_id, position_ms, tipo: play|pause|complete|seek, ts)

---

## 6) Segurança & Compliance

* **LGPD**: minimização de dados, consentimento, export/erase sob solicitação.
* **Controles parentais**: modo criança, PIN para sair, restrições por idade.
* **Transporte**: HTTPS obrigatório, HSTS, TLS 1.2+.
* **Tokens**: JWT de acesso + refresh; escopos por perfil.
* **URLs assinadas**: expiram em 1–5 min; key endpoint sem cache.
* **Rotação de chaves**: chaves HLS (AES-128) por obra e rotação periódica (se Caminho B).

---

## 7) Deploy em VPS (Docker)

* **Containers**:

  * `api` (NestJS)
  * `web` (Next.js)
  * `worker` (FFmpeg + jobs)
  * `postgres`
  * `redis`
  * `proxy` (nginx/caddy)
* **Rede interna** Docker; volumes persistentes para **Postgres** e **Redis**.
* **Zero-downtime**: `docker compose` com estratégia de atualização + healthchecks.
* **Certificados TLS**: **Let’s Encrypt** (Caddy automatiza).

---

## 8) Observabilidade & Qualidade

* **Logs**: JSON estruturado (requestId, userId, trackId, jobId).
* **Métricas**: CPU, memória, latência, taxa de erro, throughput por endpoint, consumo por segmento (B).
* **Tracing**: OpenTelemetry (API ↔ Worker).
* **Alertas**: limites em fila (jobs pendentes), quedas de taxa de play, falhas de webhook de billing.
* **Testes**: unitários nos módulos, contratuais (OpenAPI), e2e básicos (playback-url, ingest).

---

## 9) Roadmap (curto prazo)

1. **MVP** (Caminho A)
   Auth/Perfis, Catálogo básico, Playback com MP3 progressivo, Assinaturas (webhook), Notificações simples, Downloads básicos.
2. **Ingest Pipeline**
   Presigned upload → job → processamento (sem transcodar no A; apenas validação/tags).
3. **Migração para HLS** (Caminho B – ativável por feature flag)
   Worker FFmpeg, playlists HLS, URLs/chaves assinadas, atualização do player.
4. **Polimento infantil**
   UI acessível, sleep timer, capítulos, retomada por perfil.

---

## 10) Riscos & Mitigações

* **Transcodificação pesada** → worker dedicado + fila, limitar concorrência, autoscale manual.
* **Latência na mídia** → CDN próxima + HTTP/2/3, segments curtos (B), cache agressivo.
* **Cobrança/recorrência** → webhooks idempotentes, dunning, relatórios de falha.
* **Compliance infantil** → revisão legal, copy clara, privacidade por design.

---

## 11) Aceite destas decisões

* ✅ **Web**: Next.js
* ✅ **Mobile**: RN (Expo)
* ✅ **Backend**: Node + NestJS (monólito modular)
* ✅ **Banco**: Postgres; **Cache**: Redis
* ✅ **Mídia**: S3 compatível + CDN
* ✅ **Infra**: Docker em VPS
* ✅ **Estratégia de mídia**: **Caminho A** (MVP) → **Caminho B** (escala/qualidade) quando necessário

> Sugerido salvar em `docs/PLANO_ARQUITETURA.md` e atualizar a cada decisão relevante.
