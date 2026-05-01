# Stage 1: Build
FROM oven/bun:latest AS builder

WORKDIR /src

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the Nuxt 4 application
RUN bun run build

# Stage 2: Production
FROM oven/bun:slim AS runner

WORKDIR /app

# Copy the build output from the builder stage
# Nuxt builds the standalone server into .output
COPY --from=builder /src/.output ./.output

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Run the Nitro server using Bun
CMD ["bun", ".output/server/index.mjs"]
