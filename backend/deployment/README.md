# Game Brain backend deployment (Pulumi + EC2 free tier)

Deploys the GraphQL backend to AWS EC2 (t3.micro, free tier). Public traffic goes through **Cloudflare DNS proxy** (orange cloud) for HTTPS and security; no Worker required.

## What gets deployed

- **EC2** – One t3.micro (Amazon Linux 2 ECS-optimized), runs the backend in Docker from ECR
- **ECR** – Repository for the backend image (built and pushed by GitHub Actions)
- **Elastic IP** – Stable public IP for the instance (point your API domain A record here)
- **Secrets** – `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` stored in SSM Parameter Store; ECS task gets them at runtime

No RDS (database is Supabase). No CloudFront or ACM (HTTPS is handled by Cloudflare).

## Prerequisites

- Pulumi CLI: https://www.pulumi.com/docs/get-started/install/
- Node.js and pnpm (see repo root)
- AWS credentials (for local `pulumi up`) or use GitHub Actions only
- Pulumi Cloud (or self-hosted backend) and a stack (e.g. `game-brain`)

## Pulumi config (required)

Set these **before** running `pulumi up`. Use `--secret` for sensitive values so they are encrypted in the stack.

```bash
cd backend/deployment
pnpm install

# Required: Supabase (or other Postgres) connection strings and JWT secret
pulumi config set --secret databaseUrl 'postgresql://...'
pulumi config set --secret directUrl  'postgresql://...'
pulumi config set --secret jwtSecret  'your-jwt-secret'

# Optional: AWS region (defaults to us-east-1)
pulumi config set aws:region us-east-1

# Optional: EC2 key pair name for SSH (see "SSH access" below)
pulumi config set keyName your-key-pair-name
```

## Deploy via GitHub Actions

1. **Secrets** (repo Settings → Secrets and variables → Actions):
   - `PULUMI_ACCESS_TOKEN` – From Pulumi Cloud (Account → Access Tokens)
   - **AWS** (choose one):
     - **OIDC:** Configure an IAM role with trust for GitHub OIDC and permissions for ECR, EC2, SSM, IAM (for the deployment). Add the role ARN as `AWS_ROLE_TO_ASSUME`.
     - **Static keys:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` for a user with the same permissions.

2. **Trigger:** Push to `main` (when `backend/**` or `backend/deployment/**` change) or run the **“Deploy Backend”** workflow manually.

3. The workflow will:
   - Build the backend Docker image and push it to ECR
   - Run `pulumi up` in `backend/deployment`
   - Force a new ECS deployment so the task runs the latest image

## Deploy locally (optional)

```bash
cd backend/deployment
pnpm install
pulumi stack select game-brain   # or your stack name
pulumi up
```

After the first deploy, the EC2 instance will run the task from ECR. For subsequent code changes, re-run the GitHub workflow (or push to `main`); the workflow forces a new ECS deployment.

## Cloudflare DNS proxy setup

The backend listens on **port 80**. Use Cloudflare DNS with **proxy enabled** (orange cloud) so Cloudflare provides HTTPS, DDoS protection, and WAF.

1. **Get the origin IP:** After deploy, run `pulumi stack output ec2OriginUrl` (e.g. `http://34.202.60.131:80`). The host is your Elastic IP.

2. **Add DNS record:** In Cloudflare, add an **A** record for your API hostname (e.g. `api.game-brain.net`) pointing to that Elastic IP. Enable **Proxy** (orange cloud). Cloudflare will proxy HTTPS (443) to your origin on port 80 with “Flexible” SSL, or use “Full” if you add TLS on the origin.

3. **API URL for mobile:** Use your proxied hostname, e.g. `https://api.game-brain.net/graphql`. Set this in EAS build environment variables (or `.env` for local production builds).

CORS is handled by the backend; no Worker is required.

## SSH access

If EC2 Instance Connect and Session Manager don’t work, use key-based SSH:

1. **Create a key pair** (once): In AWS Console → EC2 → Key Pairs → Create key pair. Name it (e.g. `game-brain-backend`), choose `.pem`, download and store the file securely (e.g. `chmod 400 game-brain-backend.pem`).

2. **Configure Pulumi** and redeploy so the instance gets the key:
   ```bash
   pulumi config set keyName game-brain-backend
   pulumi up
   ```
   Pulumi will replace the instance (new instance with the key; Elastic IP is reattached).

3. **Connect** (use the Elastic IP from `pulumi stack output ec2OriginUrl`, e.g. `http://34.202.60.131:80` → IP is `34.202.60.131`):
   ```bash
   ssh -i /path/to/game-brain-backend.pem ec2-user@34.202.60.131
   ```

## Exports

After `pulumi up`:

| Export            | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `ec2OriginUrl`    | `http://<elastic-ip>:80` – use the IP for your A record    |
| `ecrRepositoryUrl`| ECR repository URL for the backend image                   |
| `ecrRepositoryName` | ECR repository name                                      |
| `ecsClusterName`  | ECS cluster name                                           |
| `ecsServiceName`  | ECS service name                                           |

## Tear down

```bash
pulumi destroy
```

Then remove the stack if desired: `pulumi stack rm game-brain`.
