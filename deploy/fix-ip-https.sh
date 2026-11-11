#!/usr/bin/env bash
set -euo pipefail
umask 077
root=/opt/type-dutch-sync
if [[ "$EUID" -ne 0 || ! -f "$root/.type-dutch-sync-managed" ]]; then
  printf 'Run as root on the server containing the installed Type Dutch sync service.\n' >&2; exit 1
fi
cd "$root/deploy"
api_host=$(sed -n 's/^API_HOST=//p' .env | head -n 1)
if [[ ! "$api_host" =~ ^[a-zA-Z0-9.-]+$ ]]; then printf 'Invalid API_HOST in the existing service configuration.\n' >&2; exit 1; fi
backup="Caddyfile.before-default-sni.$(date +%Y%m%d%H%M%S)"
cp -p Caddyfile "$backup"
if ! grep -q '^[[:space:]]*default_sni[[:space:]]' Caddyfile; then
  stage=$(mktemp ./Caddyfile.sni.XXXXXX)
  trap 'rm -f -- "$stage"' EXIT
  { printf '{\n  default_sni %s\n}\n\n' "$api_host"; cat "$backup"; } > "$stage"
  # Keep the existing file inode: the running proxy bind-mounts this exact file.
  cat "$stage" > Caddyfile
fi
if docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
  printf '\nHTTPS configuration reloaded. Checking the normal IP connection with certificate verification:\n'
  curl --fail --silent --show-error --retry 3 --retry-delay 2 --connect-timeout 5 --max-time 12 "https://$api_host/api/v1/health"
  printf '\nIP HTTPS check completed. Existing accounts, invitations and progress are unchanged.\n'
else
  cat "$backup" > Caddyfile
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
  printf 'Validation failed; the previous configuration has been restored.\n' >&2; exit 1
fi
