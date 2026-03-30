# Backend Deployment – Pulumi + AWS

This directory contains the **infrastructure-as-code** for deploying the games backend to AWS. It uses **Pulumi** (TypeScript) to provision EC2, ECR, secrets, and scheduled Lambdas. The app is fronted by **Cloudflare** for HTTPS; the backend listens on port **8080**.

I use this setup in interviews to discuss how I deploy a production API: minimal footprint, secrets management, CI/CD, and scheduled jobs.

---

## 🚀 Overview

- **Compute**: Backend runs on **EC2** (e.g. t4g.small, Amazon Linux 2 ARM), serving the GraphQL API inside **Docker** from an **ECR** image.
- **Secrets**: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ADMIN_SECRET` (and optional `graphqlHiveAccessToken`) live in **SSM Parameter Store**; the app reads them at runtime.
- **Database**: **Supabase** (external). No RDS in this stack.
- **HTTPS**: **Cloudflare** DNS proxy in front of the instance. Origin is `http://<elastic-ip>:8080`; Cloudflare terminates TLS.
- **Automation**: A **Lambda** (e.g. `createDailyChallenge`) runs on a schedule (e.g. midnight EST via EventBridge); it calls the GraphQL API to create the daily challenge. Image build and deploy are done by **GitHub Actions**.

---

## 📦 What Gets Deployed

| Resource           | Purpose                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **EC2**            | One instance (e.g. t4g.small), runs the backend in Docker from ECR                                                  |
| **ECR**            | Repository for the backend image (built and pushed by GitHub Actions)                                              |
| **Elastic IP**     | Stable public IP for the instance (used for API domain A record)                                                   |
| **SSM Parameters** | `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ADMIN_SECRET` (and optional Hive token); app receives them at runtime |
| **Lambda**         | e.g. `createDailyChallenge` – runs daily (EventBridge Scheduler), calls the GraphQL API                            |

Database is Supabase (no RDS). HTTPS is handled by Cloudflare (no ACM/CloudFront in this repo).

---

## 🧑‍💻 Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- Node.js and **pnpm** (see repo root)
- **AWS credentials** (for local `pulumi up`) or use GitHub Actions for deploy
- **Pulumi Cloud** (or self-hosted) and a stack

---

## ⚙️ Configuration

Set config **before** running `pulumi up`. Use `--secret` for sensitive values so they are encrypted in the stack.

```bash
cd backend/deployment
pnpm install

# Required (use --secret for sensitive values)
pulumi config set --secret databaseUrl '...'
pulumi config set --secret directUrl  '...'
pulumi config set --secret jwtSecret  '...'
pulumi config set --secret adminSecret '...'   # for admin-only GraphQL (e.g. createDailyChallenge Lambda)
pulumi config set --secret graphqlHiveAccessToken '...'  # optional; GraphQL Hive usage reporting

# Optional
pulumi config set aws:region us-east-1
pulumi config set keyName <your-key-pair-name>   # for SSH access to EC2
# Scheduled Lambdas: set config key `lambdas` (array of { name, handlerSubpath, scheduleExpression, scheduleExpressionTimezone? }) in stack YAML
```

---

## 🚢 Deploy

**Via GitHub Actions (typical):** Push to `main` when `backend/**` or `backend/deployment/**` change, or run the **“Deploy Backend”** workflow manually. Repo secrets must include Pulumi and AWS credentials (see your team or CI docs).

**Locally:**

```bash
cd backend/deployment
pnpm install
pnpm run build:lambdas   # build Lambda handlers (required before first deploy)
pulumi stack select <stack-name>
pulumi up
```

---

## 📍 Post-Deploy

- **DNS:** Point your API hostname’s **A record** to the **Elastic IP**. Use Cloudflare with proxy on, and set an **Origin Rule** so the proxy uses port **8080** (app does not listen on 80).
- **Origin URL:** Run `pulumi stack output ec2OriginUrl` to get `http://<elastic-ip>:8080`; use that IP for the A record.
- **SSH:** If you configured `keyName`, use `ssh -i <key.pem> ec2-user@<elastic-ip>` for debugging.

---

## 📤 Stack Outputs

| Output              | Description                |
| ------------------- | -------------------------- |
| `ec2OriginUrl`      | `http://<elastic-ip>:8080` |
| `ecrRepositoryUrl`  | ECR repository URL         |
| `ecrRepositoryName` | ECR repository name        |
| `ecsClusterName`    | ECS cluster name (if used) |
| `ecsServiceName`    | ECS service name (if used) |

---

## 🗑 Tear Down

```bash
pulumi destroy
pulumi stack rm <stack-name>   # optional
```

---

## 🧱 Architecture

- **Why Pulumi**
  - IaC in TypeScript so the team can reuse types and logic. Changes are reviewed in PRs like application code.

- **Secrets**
  - No secrets in code or in the container image. SSM Parameter Store holds env vars; the app reads them at startup. Pulumi config uses `--secret` so stack state is encrypted.

- **Cost and scope**
  - Single EC2 + Elastic IP + Lambda is enough for a demo or low-traffic API. We can add RDS, ALB, or ECS later if requirements grow.

- **CI/CD**
  - GitHub Actions builds the Docker image, pushes to ECR, and runs `pulumi up` (or equivalent) so that merges to `main` drive deploys.

- **Scheduled jobs**
  - EventBridge triggers a Lambda on a schedule; the Lambda calls the same GraphQL API (e.g. admin mutation) so business logic stays in one place and is testable without deploying Lambda code for every change.

- **HTTPS and DNS**
  - Cloudflare gives us TLS and DDoS protection without managing certificates in AWS. Origin is fixed (Elastic IP + port 8080), so we only configure DNS and one Origin Rule.
