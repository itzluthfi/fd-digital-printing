# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for FD Digital Printing (SvelteKit + Bun)

# ------------------------------------------------------------------------------
# Stage 1: Build stage
# ------------------------------------------------------------------------------
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Salin manifest dependensi & install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Salin seluruh kode sumber
COPY . .

# Dummy environment untuk Better Auth saat kompilasi build
ENV BETTER_AUTH_SECRET=ci-build-dummy-secret-key-32-chars
ENV NODE_ENV=production

# Kompilasi aplikasi SvelteKit (adapter-node menghasilkan folder build/)
RUN bun run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------------------------
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Variabel Lingkungan Standar Produksi
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DB_PATH=/app/data/app.db
ENV BETTER_AUTH_URL=http://localhost:3000
ENV BETTER_AUTH_SECRET=fd_printing_production_secret_key_minimum_32_characters

# Install dependensi khusus produksi
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Salin artifak hasil build dari stage builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static
COPY --from=builder /app/src/lib/server/db ./src/lib/server/db

# Buat direktori data untuk volume database SQLite
RUN mkdir -p /app/data

# Salin script entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port aplikasi
EXPOSE 3000

# Entrypoint otomatis menginisialisasi skema DB dan menjalankan server
ENTRYPOINT ["./docker-entrypoint.sh"]
