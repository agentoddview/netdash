# ---------- Stage 1: build the Vite app ----------
FROM node:20.19-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy the rest of the source and build
COPY . .
RUN npm run build

# ---------- Stage 2: run a static server ----------
FROM node:20.19-alpine AS runner

WORKDIR /app

# Tiny static file server
RUN npm install -g serve

# Copy built app from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Serve the Vite build on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
