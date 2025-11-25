# KoinVote 部署說明（dev / prod + SSL + CI/CD）

本文件說明如何將這個 repo 部署到 GCP 上的 dev / prod 環境，並透過 GitHub Actions 自動部署，以及使用 Let's Encrypt 設定 SSL（HTTPS）。

---

## 環境總覽

- Repo: `https://github.com/koinvote/frontend`
- Branch 約定：
  - `dev`：部署到開發機（dev 環境）
  - `main`：部署到正式機（prod 環境）
- Domain：
  - Prod：`koinvote.com` → 指向 prod VM
  - Dev：`dev.koinvote.com` → 指向 dev VM（選用）

---

## 一、GCP VM 基本設定（dev / prod 都通用）

### 1. 建立 VM

在 GCP 建立兩台 VM：

- `koinvote-dev`（dev）
- `koinvote-prod`（prod）

設定建議：

- OS：Debian 12 (bookworm)
- Machine type：`e2-medium` 或依實際需求
- 啟動磁碟：10–20GB 以上
- 防火牆：
  - ✅ Allow HTTP traffic
  - ✅ Allow HTTPS traffic

建立完成後，記得把 External IP 設為 **靜態 IP**。

### 2. 安裝基本套件

SSH 進 VM 後：

```bash
sudo apt update
sudo apt install -y git nginx

# 安裝 Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v
