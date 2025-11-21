Checklist de Produção

- Web
  - Definir variáveis (.env): `API_BASE_URL`, `GOOGLE_CLIENT_ID`, domínio de cookies, `NODE_ENV=production`.
  - Build e deploy com HTTPS habilitado; validar headers de cache e compressão.
  - Verificar CORS do backend para o domínio web.

- Backend
  - Variáveis (.env): banco de dados, `JWT_SECRET`, SMTP (verificação e recuperação), S3/R2 (`S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, chaves), `CORS_ORIGINS`.
  - Ajustar cookies para produção: `secure=true`, `sameSite=lax`, domínio correto.
  - Docker produção: imagem otimizada (multi-stage), healthcheck, logs, limites de recursos.
  - HTTPS atrás de proxy/reverse proxy; configurar `trust proxy` se aplicável.

- Mobile
  - Atualizar `app.json > expo.extra.apiBaseUrl` para domínio público do backend.
  - Google OAuth (produção nativa): criar `androidClientId` (Android) e `iosClientId` (iOS); registrar SHA-1 do keystore Android; definir Redirect URIs.
  - Expo Go (teste): usar Web Client ID e Redirect URI `https://auth.expo.io/@<expo-username>/mobile` (ou `@anonymous`).
  - Preparar ícone, splash, permissões e privacidade para lojas.

- S3/R2 (Arquivos e mídia)
  - Criar bucket e configurar CORS: permitir GET/HEAD do domínio web/mobile; se upload no cliente, permitir PUT conforme necessário.
  - Definir `Cache-Control` e `Content-Type` corretos; opcional: CDN em frente ao bucket.
  - Revisar políticas de acesso (privado vs público, URLs assinadas).

- Segurança
  - Somente HTTPS; HSTS no domínio web.
  - Rotacionar segredos (`JWT_SECRET`, chaves S3) e armazenar em gerenciador seguro.
  - Restringir CORS a domínios oficiais; validar inputs e rate limiting básico.

- Observabilidade
  - Logs centralizados (app e proxy); métricas básicas (CPU, memória, 5xx).
  - Alertas para indisponibilidade do backend.

- Domínios/DNS
  - Apontar domínio do web e backend; configurar certificados TLS.
  - Configurar CNAME/records para CDN (se usado) e endpoints de mídia.

- Validação final
  - Fluxos de autenticação: local (login/registro/verificação) e social (Google) em produção.
  - Recuperação de senha via e-mail e redirecionamentos.
  - Teste de upload/serving de mídia e CORS.
  - Smoke test das principais páginas e APIs.