# KoinVote Deployment Guide (dev / prod + SSL + CI/CD)

This document explains how to deploy this repository to Google Cloud Platform (GCP) for both **dev** and **prod** environments, set up **HTTPS with Let's Encrypt**, and configure **GitHub Actions** for automatic deployments.

---

## Overview

- Repo: `https://github.com/koinvote/frontend`
- Branch convention:
  - `dev`: deployed to the **dev** VM (staging environment)
  - `main`: deployed to the **prod** VM (production environment)
- Domains:
  - Prod: `koinvote.com` → points to the prod VM
  - Dev: `dev.koinvote.com` → points to the dev VM (optional)

---

## 1. GCP VM baseline setup (shared for dev / prod)

### 1.1 Create VMs

Create two VMs in GCP:

- `koinvote-dev` (dev)
- `koinvote-prod` (prod)

Recommended settings:

- OS: **Debian 12 (bookworm)**
- Machine type: `e2-medium` (or adjust as needed)
- Boot disk: at least **10–20GB**
- Firewall:
  - ✅ Allow HTTP traffic  
  - ✅ Allow HTTPS traffic  

After creation, change each VM’s **External IP** to **Static**.

### 1.2 Install base packages

SSH into each VM, then:

```bash
sudo apt update
sudo apt install -y git nginx

# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v