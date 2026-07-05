#!/usr/bin/env bash
# Kill a constellation: delete the record, blocklist its description hash so
# byte-identical resubmission bounces, and purge the /api/sky edge cache so
# the removal is globally immediate. This is the admin panel (eng review:
# reactive manual moderation, no scheduled duty).
#
# Usage:
#   scripts/kill-constellation.sh <record-id> "<original description>"
#
# Requires: wrangler (authed), curl, python3. Env:
#   KV_NAMESPACE_ID   — the SKY KV namespace id
#   CF_ZONE_ID        — zone for the cache purge
#   CF_API_TOKEN      — token with cache_purge permission
#   SITE_ORIGIN       — e.g. https://isaacau.com
set -euo pipefail

ID="${1:?usage: kill-constellation.sh <record-id> \"<description>\"}"
DESC="${2:?usage: kill-constellation.sh <record-id> \"<description>\"}"

HASH=$(python3 -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].strip().lower().encode()).hexdigest())" "$DESC")

echo "deleting record constellation:$ID"
wrangler kv key delete --namespace-id "$KV_NAMESPACE_ID" "constellation:$ID"

echo "blocklisting description hash $HASH"
wrangler kv key put --namespace-id "$KV_NAMESPACE_ID" "blocklist:$HASH" "1"

echo "purging /api/sky edge cache"
curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"files\":[\"$SITE_ORIGIN/api/sky\"]}" > /dev/null

echo "done — gone from the sky, resubmission blocked"
