# Game Brain backend deployment (Pulumi + EC2 free tier)

Deploys the GraphQL backend to AWS EC2 (t2.micro, free tier). All public traffic is intended to go through a **Cloudflare Worker** for HTTPS; the Worker proxies to this EC2 instance.

## What gets deployed

- **EC2** – One t2.micro (Amazon Linux 2023), runs the backend in Docker from ECR
- **ECR** – Repository for the backend image (built and pushed by GitHub Actions)
- **Elastic IP** – Stable public IP for the instance (used as origin by the Cloudflare Worker)
- **Secrets** – `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` stored in SSM Parameter Store; EC2 user data fetches them at boot

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
   - Print the exported `ec2OriginUrl` (e.g. `http://<elastic-ip>:4000`)

## Deploy locally (optional)

```bash
cd backend/deployment
pnpm install
pulumi stack select game-brain   # or your stack name
pulumi up
```

After the first deploy, the EC2 instance will pull the image from ECR on boot. For subsequent code changes, re-run the GitHub workflow (or push to `main`) so a new image is built and pushed; the instance can be updated by redeploying (e.g. replace the instance or run a script to pull the new image and restart the container).

## Cloudflare Worker setup

All public API traffic should go through a Cloudflare Worker so that HTTPS is handled by Cloudflare (no ACM/CloudFront on AWS).

1. **Create the Worker** (see repo `cloudflare-worker/`):
   - Deploy: `cd cloudflare-worker && pnpm install && pnpm run deploy`
   - Set the origin URL secret to the value Pulumi exports as `ec2OriginUrl`:
     ```bash
     cd cloudflare-worker
     npx wrangler secret put EC2_ORIGIN_URL
     # Paste: http://<elastic-ip>:4000  (from `pulumi stack output ec2OriginUrl`)
     ```

2. **Custom domain (optional):** In the Cloudflare dashboard, add a route for your API domain (e.g. `api.yourdomain.com/*`) to this Worker. The mobile app will use this URL.

3. **API URL for mobile:** Set `EXPO_PUBLIC_GRAPHQL_URL` to your public API base (HTTPS), e.g.:
   - With custom domain: `https://api.yourdomain.com/graphql`
   - With workers.dev: `https://game-brain-api.<your-subdomain>.workers.dev/graphql`
   Set this in EAS build environment variables (or in `.env` for local production builds) so the app uses the deployed API.

## Exports

After `pulumi up`:

| Export            | Description                                      |
| ----------------- | ------------------------------------------------- |
| `ec2OriginUrl`    | `http://<elastic-ip>:4000` – use as Worker origin |
| `ecrRepositoryUrl`| ECR repository URL for the backend image         |
| `ecrRepositoryName` | ECR repository name                            |
| `instanceId`      | EC2 instance ID                                  |

## Tear down

```bash
pulumi destroy
```

Then remove the stack if desired: `pulumi stack rm game-brain`.
