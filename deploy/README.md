# 私有账号同步服务

网站继续托管于 GitHub Pages，服务器仅保存账号、带版本号的学习快照和最近五份历史。SQLite 数据位于 `/opt/type-dutch-sync/deploy/data`，不放进 Git 仓库。学习者使用用户名和密码登录；没有邮件服务依赖。

需要 Linux、Docker 和 Docker Compose 插件，以及公网可访问的 80/443 端口。安装器遇到已占用的端口会停止，保留原有服务。不要运行 `docker compose down -v`，也不要删除 `deploy/data` 或 Caddy 的证书卷。

## 安装

审核 `deploy/install.sh`、`compose.yaml` 和 `Caddyfile`，在服务器下载固定 Git 提交的安装脚本，再运行：

```sh
curl -fsSLo /tmp/type-dutch-install.sh https://raw.githubusercontent.com/KoalaLaw/Dutch/COMMIT_SHA/deploy/install.sh
bash /tmp/type-dutch-install.sh COMMIT_SHA 8.220.72.103
```

脚本安装到独立目录，不修改 SSH，不开启数据库公网端口。需要在云服务商安全组中允许 TCP 80/443。Caddy 为域名或公网 IP 申请 Let's Encrypt 的 shortlived 证书并自动续期；IP 证书要求该 ACME profile，必须验证浏览器信任和自动续期后再启用登录。

首次安装会在服务器生成随机注册码；root 可读取 `/opt/type-dutch-sync/registration-code.txt` 并交给允许注册的学习者。不要把该文件、`.env`、数据库或备份提交到 Git。

检查 `https://8.220.72.103/api/v1/health` 返回 `ok: true` 后，将前端 `app/data/cloud-config.json` 的 `apiURL` 配置为 `https://8.220.72.103/api/v1`，再发布 GitHub Pages。证书不受信任时不要绕过警告使用登录。

## 已有 Nginx / HTTPS 服务

只运行后端：`docker compose up -d --build backend`。在已正确配置 HTTPS 的服务器块加入：

```nginx
location /api/v1/ {
    client_max_body_size 9m;
    proxy_pass http://127.0.0.1:5580;
    proxy_set_header X-Dutch-Client-IP $remote_addr;
    proxy_set_header Host $host;
}
```

该 location 应位于专用的 API 主机。前端 CORS 仅允许 `https://koalalaw.github.io`，浏览器只通过 HTTPS 发送随机会话令牌。数据库按已验证的令牌确定用户，忽略客户端提供的用户 ID。密码使用带随机 salt 的 scrypt 散列；服务仅保存令牌的 SHA-256 散列。

## 备份与维护

在 `/opt/type-dutch-sync/deploy` 中运行：

```sh
docker compose exec -T backend node server/admin.mjs backup
docker compose exec -T backend node server/admin.mjs users
```

`backup` 使用 SQLite 在线备份接口生成 `data/backups/*.sqlite`。将备份另行复制到安全位置。恢复时先停止 backend，将经过校验的备份复制为 `data/dutch.sqlite`，保留当前数据库副本并处理原 WAL/SHM 文件，再重启。前端会检测服务器版本回退并要求选择进度，不会自动覆盖本机。

重置忘记的密码（密码从 stdin 传入，不进入命令行参数）：

```sh
read -rsp '新密码（至少12字符）: ' new_password; printf '\n'
printf '%s' "$new_password" | docker compose exec -T backend node server/admin.mjs reset-password USERNAME
unset new_password
```

重置会注销该用户的所有旧会话。此操作应由管理员在服务器终端亲自执行。当前服务没有公网管理或密码重置接口。

## 同步规则

每个账号使用独立 IndexedDB 数据库；访客继续使用原数据库。更换账号会重新加载页面，避免迟到的旧账号写入进入新账号。首次登录有云端进度时恢复云端；空账号可以显式复制本机访客数据，原访客副本保留。

保存使用服务器 revision 的比较后更新。两台电脑从相同 revision 开始写入时，后到的请求得到 409，页面提供版本摘要和显式选择；不会悄悄覆盖。断网时保留 dirty 标记、离线进度和当前账号缓存，恢复网络重试。自建文章中只存在于设备上的音频文件不能云同步；内置荷兰语课程不受影响。

源码更新后运行 `node scripts/package-dutch-server.mjs` 重新生成确定内容的部署包和 SHA-256 文件，并一并提交。
