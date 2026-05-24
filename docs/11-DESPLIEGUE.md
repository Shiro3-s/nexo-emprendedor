# 11 — Despliegue con Docker

---

## Estrategia de Despliegue

Un solo `docker-compose.yml` orquesta:
- **app**: Next.js app (frontend + API)
- **db**: PostgreSQL 16
- **redis**: (opcional) Caché y sesiones

---

## Dockerfile

```dockerfile
# docker/Dockerfile
FROM node:20-alpine AS base

# Dependencias
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/
RUN corepack enable && pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN corepack enable && pnpm build

# Producción
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
```

---

## docker-compose.yml

```yaml
# docker-compose.yml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: nexo-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://nexo_user:nexo_pass@db:5432/nexo_emprendedor
      - NEXTAUTH_URL=https://${DOMAIN}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - AZURE_AD_CLIENT_ID=${AZURE_AD_CLIENT_ID}
      - AZURE_AD_CLIENT_SECRET=${AZURE_AD_CLIENT_SECRET}
      - AZURE_AD_TENANT_ID=${AZURE_AD_TENANT_ID}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - nexo-network

  db:
    image: postgres:16-alpine
    container_name: nexo-db
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=nexo_user
      - POSTGRES_PASSWORD=nexo_pass
      - POSTGRES_DB=nexo_emprendedor
    volumes:
      - nexo-db-data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nexo_user -d nexo_emprendedor"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - nexo-network

  # Opcional: Redis para caché
  # redis:
  #   image: redis:7-alpine
  #   container_name: nexo-redis
  #   ports:
  #     - "6379:6379"
  #   restart: unless-stopped
  #   networks:
  #     - nexo-network

volumes:
  nexo-db-data:

networks:
  nexo-network:
    driver: bridge
```

---

## Nginx Reverse Proxy

```nginx
# docker/nginx.conf
server {
    listen 80;
    server_name *.nexoemprendedor.com nexoemprendedor.com;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Despliegue en VPS

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-org/nexo-emprendedor.git
cd nexo-emprendedor

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales

# 3. Iniciar servicios
docker compose up -d

# 4. Ejecutar migraciones
docker compose exec app npx prisma migrate deploy

# 5. Crear primer tenant (UNIMINUTO)
docker compose exec app node scripts/create-tenant.js \
  --slug=uniminuto \
  --name="UNIMINUTO" \
  --email-domain="@uniminuto.edu"
```

---

## Variables de Entorno

```env
# .env.example
DOMAIN=nexoemprendedor.com

# Base de datos
DATABASE_URL=postgresql://nexo_user:nexo_pass@localhost:5432/nexo_emprendedor

# NextAuth
NEXTAUTH_URL=https://nexoemprendedor.com
NEXTAUTH_SECRET=generar-con-openssl-rand-base64-32

# Azure AD (UNIMINUTO)
AZURE_AD_CLIENT_ID=xxxx
AZURE_AD_CLIENT_SECRET=xxxx
AZURE_AD_TENANT_ID=xxxx

# Email (para notificaciones)
RESEND_API_KEY=re_xxxx

# File upload (Uploadthing o S3)
UPLOADTHING_SECRET=xxxx
UPLOADTHING_APP_ID=xxxx
```

---

## CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -f docker/Dockerfile -t nexo-app .

      - name: Deploy to VPS
        run: |
          docker save nexo-app | ssh user@vps "docker load"
          ssh user@vps "docker compose up -d"
```

---

## Monitoreo

```bash
# Logs
docker compose logs -f app

# Backup de base de datos
docker compose exec db pg_dump -U nexo_user nexo_emprendedor > backup.sql

# Restore
docker compose exec -T db psql -U nexo_user nexo_emprendedor < backup.sql
```

---

## Escalado

Para múltiples instancias:
```yaml
# Agregar en docker-compose.yml
  app:
    deploy:
      replicas: 3
```

Con Nginx como balanceador de carga.

---

## Requisitos del Servidor

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB SSD | 50 GB SSD |
| SO | Ubuntu 22.04+ | Ubuntu 24.04 |
| Docker | 24+ | 25+ |
| Docker Compose | 2.20+ | 2.25+ |
| Dominio | nexoemprendedor.com + wildcard *.nexoemprendedor.com |
| SSL | Let's Encrypt (certbot) | Automático con Nginx Proxy Manager |
