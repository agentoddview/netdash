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
FROM node:22.12-alpine AS runtime

WORKDIR /app

# Simple static file server
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Serve the built app on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
