#!/usr/bin/env bash
set -euo pipefail
umask 077
source_ref="${1:-main}"
api_host="${2:-8.220.72.103}"
install_root=/opt/type-dutch-sync
if [[ "$EUID" -ne 0 ]]; then printf 'Run this installer as root or with sudo.\n' >&2; exit 1; fi
if [[ ! "$source_ref" =~ ^[a-f0-9]{40}$ && "$source_ref" != main ]]; then printf 'Invalid source revision.\n' >&2; exit 1; fi
if [[ ! "$api_host" =~ ^[a-zA-Z0-9.-]+$ ]]; then printf 'Invalid public IP or domain.\n' >&2; exit 1; fi
if [[ -d "$install_root" && ! -f "$install_root/.type-dutch-sync-managed" && -n "$(find "$install_root" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  printf 'The target directory contains an unrecognized installation. Nothing has been replaced.\n' >&2; exit 1
fi
for binary in docker curl tar sha256sum openssl ss; do
  if ! command -v "$binary" >/dev/null; then printf 'Missing prerequisite: %s. No service has been changed.\n' "$binary" >&2; exit 1; fi
done
docker compose version >/dev/null
if [[ ! -f "$install_root/deploy/.env" ]]; then
  if ss -H -ltn '( sport = :80 or sport = :443 )' | read -r _; then
    printf 'Ports 80/443 already serve another application. Stopping here without replacing it. Use deploy/README.md to connect the existing HTTPS proxy.\n' >&2
    exit 1
  fi
fi
stage_dir=$(mktemp -d /tmp/type-dutch-sync.XXXXXX)
trap 'rm -rf -- "$stage_dir"' EXIT
base="https://raw.githubusercontent.com/KoalaLaw/Dutch/$source_ref/deploy"
curl --fail --silent --show-error --location "$base/type-dutch-sync.tar.gz" -o "$stage_dir/type-dutch-sync.tar.gz"
curl --fail --silent --show-error --location "$base/type-dutch-sync.tar.gz.sha256" -o "$stage_dir/type-dutch-sync.tar.gz.sha256"
(cd "$stage_dir" && sha256sum -c type-dutch-sync.tar.gz.sha256)
mkdir -p "$install_root"
# The archive has a fixed allowlist and contains no runtime database, credentials or .env.
tar -xzf "$stage_dir/type-dutch-sync.tar.gz" -C "$install_root"
printf '%s\n' "$source_ref" > "$install_root/.type-dutch-sync-managed"
mkdir -p "$install_root/deploy/data"
chown 1000:1000 "$install_root/deploy/data"
chmod 700 "$install_root/deploy/data"
if [[ ! -f "$install_root/deploy/.env" ]]; then
  registration_code=$(openssl rand -hex 16)
  printf 'API_HOST=%s\nREGISTRATION_MODE=invite\nREGISTRATION_CODE=%s\n' "$api_host" "$registration_code" > "$install_root/deploy/.env"
  printf '%s\n' "$registration_code" > "$install_root/registration-code.txt"
  chmod 600 "$install_root/deploy/.env" "$install_root/registration-code.txt"
  unset registration_code
fi
cd "$install_root/deploy"
if [[ -f data/dutch.sqlite ]]; then docker compose exec -T backend node server/admin.mjs backup || { printf 'Could not back up the running database. Update cancelled.\n' >&2; exit 1; }; fi
docker compose up -d --build
# Recreate the proxy so an updated bind-mounted Caddyfile is read even when its inode changed.
docker compose up -d --force-recreate caddy
printf '\nBackend started. Wait for automatic HTTPS, then check:\nhttps://%s/api/v1/health\n' "$api_host"
printf 'Your private registration code is in %s/registration-code.txt (root-only).\n' "$install_root"
printf 'Service logs: cd %s/deploy && docker compose logs --tail=50\n' "$install_root"
