# GoNexus EC2 Deployment

This guide deploys GoNexus on a single EC2 instance with Docker Compose.

Recommended EC2 setup:

- Region: ap-northeast-1 if your users are mostly in Japan
- Instance type: `t3.small`
- OS: Ubuntu 24.04 LTS or 22.04 LTS
- EBS: 30 GB gp3
- Elastic IP: enabled
- Security group inbound rules:
  - `22/tcp` from your own IP only
  - `80/tcp` from `0.0.0.0/0`
  - `443/tcp` from `0.0.0.0/0`

Do not expose MySQL, Redis, RabbitMQ, or the Go backend directly to the internet.

## 1. Install runtime packages

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and log back in after adding your user to the `docker` group.

## 2. Clone the project

```bash
git clone https://github.com/BK-1107/GoNexus.git
cd GoNexus
git checkout aws-ec2-deploy
cd GoNexus
```

## 3. Create production environment variables

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in strong passwords and API keys. Never commit `.env.prod`.

## 4. Start GoNexus

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
```

## 5. Expose the frontend to the host Nginx

The production Compose file keeps internal services private. To let host Nginx reach the frontend container, publish the frontend container on localhost only:

```yaml
ports:
  - "127.0.0.1:8080:80"
```

If this line is already present in `docker-compose.prod.yml`, no action is needed.

## 6. Configure host Nginx

Edit `deploy/ec2-nginx.conf` and replace `example.com` with your domain.

```bash
sudo cp deploy/ec2-nginx.conf /etc/nginx/sites-available/gonexus
sudo ln -s /etc/nginx/sites-available/gonexus /etc/nginx/sites-enabled/gonexus
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Point DNS to EC2

Create an A record:

```text
your-domain.com -> EC2 Elastic IP
```

Optionally:

```text
www.your-domain.com -> EC2 Elastic IP
```

## 8. Enable HTTPS

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot should install a renewal timer automatically. Verify it:

```bash
systemctl list-timers | grep certbot
```

## 9. Useful operations

Restart:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod restart
```

Update after pulling new code:

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Backup MySQL:

```bash
docker exec gonexus_mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > gonexus-$(date +%F).sql
```

Stop:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```
