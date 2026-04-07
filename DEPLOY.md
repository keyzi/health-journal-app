# Deploy to Selectel Server

This project is a static Vite PWA. The server only needs Nginx. GitHub Actions builds the app and uploads `dist/` over SSH.

## 1. Prepare the server

Install Nginx:

```bash
sudo apt update
sudo apt install -y nginx
```

Create the deploy directory:

```bash
sudo mkdir -p /var/www/health-journal
sudo chown -R $USER:$USER /var/www/health-journal
```

Copy `deploy/nginx.conf` to Nginx and replace `example.com` with your domain:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/health-journal
sudo ln -s /etc/nginx/sites-available/health-journal /etc/nginx/sites-enabled/health-journal
sudo nginx -t
sudo systemctl reload nginx
```

If the server does not have this repository, create the file manually from `deploy/nginx.conf`.

## 2. Add an SSH key for GitHub Actions

On your local machine, create a deploy key:

```bash
ssh-keygen -t ed25519 -C "github-actions-health-journal" -f ./health_journal_deploy_key
```

Add the public key to the server:

```bash
ssh-copy-id -i ./health_journal_deploy_key.pub user@server-ip
```

The private key from `./health_journal_deploy_key` goes to GitHub Secrets.

## 3. Add GitHub repository secrets

Open GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Add:

```text
SSH_HOST=your-server-ip-or-domain
SSH_PORT=22
SSH_USER=your-server-user
SSH_KEY=private key from ./health_journal_deploy_key
DEPLOY_PATH=/var/www/health-journal
```

## 4. Deploy

Push to `main`. GitHub Actions will run:

```bash
npm ci
npm run lint --if-present
npm run build
rsync dist/ to the server
```

You can also start it manually from GitHub:

```text
Actions -> Deploy -> Run workflow
```

## 5. HTTPS for PWA

iPhone PWA installation should use HTTPS. After DNS points to the server, install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Then open the HTTPS URL in Safari and use:

```text
Share -> Add to Home Screen
```
