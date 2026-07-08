# Ryda VPS CI/CD Setup

This project now includes a frontend GitHub Actions workflow at `.github/workflows/deploy-frontend.yml`.

Because your backend is deployed from a separate GitHub repository on the VPS at `/root/RydcarBackend`, a backend workflow template is also included at `deployment/backend-repo-deploy.yml.example`.

## What this setup does

### Frontend repo workflow
- runs on push to `main`
- installs frontend dependencies
- builds the Vite frontend
- uploads `dist` to `/root/dist` on the VPS
- restarts `nginx` in `/root/RydcarBackend`

### Backend repo workflow template
- runs on push to `main`
- SSHes into the VPS
- runs `git pull origin main` inside `/root/RydcarBackend`
- runs `docker compose up -d --build`

## Required GitHub secrets

Add these secrets in both repositories if you want both frontend and backend auto-deploy:

- `VPS_HOST`
  - Example: `77.68.55.33`
- `VPS_USER`
  - Example: `root`
- `VPS_SSH_PRIVATE_KEY`
  - The private key used by GitHub Actions to SSH into the VPS

## One-time VPS SSH setup for GitHub Actions

Create a dedicated deploy key on your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f github-actions-deploy
```

This creates:
- `github-actions-deploy`
- `github-actions-deploy.pub`

Append the public key to the VPS:

```bash
cat github-actions-deploy.pub
```

Then on the VPS:

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
```

Paste the public key on a new line, save, then run:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Now copy the private key file contents into the GitHub secret `VPS_SSH_PRIVATE_KEY`.

## Frontend repo setup

The workflow is already added in this repo:

- `.github/workflows/deploy-frontend.yml`

After you add the three GitHub secrets, every push to `main` that changes frontend files will:
- build the frontend
- upload `dist`
- restart nginx

## Backend repo setup

Copy this template file into the backend-only repository:

- `deployment/backend-repo-deploy.yml.example`

Place it there as:

```text
.github/workflows/deploy-backend.yml
```

Then add the same three GitHub secrets in the backend repository.

## Current VPS paths expected by the workflows

- Frontend output path on VPS: `/root/dist`
- Backend project path on VPS: `/root/RydcarBackend`

If you move the backend project later, update the workflow command paths.

## Recommended test after setup

Push a small frontend change to `main`, then verify:

```bash
http://77.68.55.33
```

Push a backend change to the backend repo `main`, then verify:

```bash
ssh root@77.68.55.33
cd /root/RydcarBackend
docker compose ps
```

## Important note

This setup is deployment automation, not hosting logic. Your MongoDB, RabbitMQ, and backend services still run on your VPS through Docker exactly as they do now.
