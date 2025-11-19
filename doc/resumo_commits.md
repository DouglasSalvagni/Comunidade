
Correção do HLS: URI da chave AES apontando para host inválido.

- Identificado que faixas recentes transcodadas geravam `#EXT-X-KEY` com `URI` em `http://backend:3001/...`, inacessível pelo navegador (host interno do Docker) e com porta divergente do `.env` local (3003).
- Atualizado fallback do `API_BASE_URL` no worker para `http://localhost:3003/api/v1` (`backend/src/workers/transcode.worker.ts`).
- Ajustado `docker-compose.yml` para definir `API_BASE_URL` do `media-worker` como `http://localhost:3001/api/v1`, garantindo que playlists em ambiente Docker usem host alcançável pelo browser.
- Observação operacional: faixas já transcodadas com `URI` antigo precisam ser reprocessadas via `POST /api/v1/media/process` para atualizar os manifests.
Build e restart do serviço media-worker para aplicar correção.

- Executado `docker compose build media-worker` e `docker compose up -d media-worker` na raiz do projeto, garantindo que o novo `API_BASE_URL` seja usado na geração dos manifests HLS futuros.
- Verificado nos logs do container que o worker iniciou e conectou ao Redis com sucesso.
Chave HLS servida via CDN para evitar mixed content.

- Alterado o worker para publicar a chave AES (`enc.key`) no mesmo prefixo dos manifests HLS e referenciar `URI` absoluto no CDN/S3 em vez de endpoint HTTP local.
- Implementado upload da chave para S3 e uso de `CDN_BASE_URL` quando disponível; fallback para `S3_ENDPOINT/S3_BUCKET`.
- Rebuild e restart do `media-worker` concluídos.
