# ---------- Build stage ----------
FROM node:22.12-alpine AS build

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

RUN npm install -g serve

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
