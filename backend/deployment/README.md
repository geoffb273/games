# Backend deployment (Pulumi + EC2)

Deploys the GraphQL backend to AWS EC2. Traffic is fronted by **Cloudflare DNS proxy** for HTTPS; the app listens on port 8080.

## What gets deployed

- **EC2** – One t3.micro (Amazon Linux 2 ECS-optimized), runs the backend in Docker from ECR
- **ECR** – Repository for the backend image (built and pushed by GitHub Actions)
- **Elastic IP** – Stable public IP for the instance (used for your API domain A record)
- **Secrets** – `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` in SSM Parameter Store; the ECS task receives them at runtime

Database is Supabase (no RDS). HTTPS is handled by Cloudflare (no ACM/CloudFront here).

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- Node.js and pnpm (see repo root)
- AWS credentials (for local `pulumi up`) or rely on GitHub Actions
- Pulumi Cloud (or self-hosted) and a stack

## Configuration

Config is set **before** running `pulumi up`. Use `--secret` for sensitive values so they are encrypted in the stack.

```bash
cd backend/deployment
pnpm install

# Required (use --secret for sensitive values)
pulumi config set --secret databaseUrl '...'
pulumi config set --secret directUrl  '...'
pulumi config set --secret jwtSecret  '...'

# Optional
pulumi config set aws:region us-east-1
pulumi config set keyName <your-key-pair-name>   # for SSH access
```

## Deploy

**Via GitHub Actions (typical):** Push to `main` when `backend/**` or `backend/deployment/**` change, or run the **“Deploy Backend”** workflow manually. Repo secrets must include Pulumi and AWS credentials (see your team or CI docs).

**Locally:**

```bash
cd backend/deployment
pnpm install
pulumi stack select <stack-name>
pulumi up
```

## Post-deploy

- **DNS:** Point your API hostname’s A record to the Elastic IP. Use Cloudflare with proxy on, and set an **Origin Rule** so the proxy uses port **8080** (app does not listen on 80).
- **Origin URL:** Run `pulumi stack output ec2OriginUrl` to get `http://<elastic-ip>:8080`; the IP is what you use for the A record.
- **SSH:** If you need key-based SSH, create a key pair in EC2, set `keyName` in Pulumi config, redeploy, then `ssh -i <key.pem> ec2-user@<elastic-ip>`.

## Stack outputs

| Output              | Description                |
| ------------------- | -------------------------- |
| `ec2OriginUrl`      | `http://<elastic-ip>:8080` |
| `ecrRepositoryUrl`  | ECR repository URL         |
| `ecrRepositoryName` | ECR repository name        |
| `ecsClusterName`    | ECS cluster name           |
| `ecsServiceName`    | ECS service name           |

## Tear down

```bash
pulumi destroy
pulumi stack rm <stack-name>   # optional
```
