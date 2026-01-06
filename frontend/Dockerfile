# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build args for traceability
ARG BUILD_ID
ARG BUILD_TIMESTAMP
ARG GIT_COMMIT
ARG VERSION

# Labels for container metadata
LABEL org.opencontainers.image.title="Nexus Compliance Plugin UI" \
      org.opencontainers.image.version="${VERSION:-1.0.0}" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      com.adverant.build.id="${BUILD_ID}" \
      com.adverant.build.timestamp="${BUILD_TIMESTAMP}"

# Expose as environment variables for runtime
ENV NEXUS_BUILD_ID="${BUILD_ID}" \
    NEXUS_BUILD_TIMESTAMP="${BUILD_TIMESTAMP}" \
    NEXUS_GIT_COMMIT="${GIT_COMMIT}" \
    NEXUS_VERSION="${VERSION:-1.0.0}"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set proper ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/compliance || exit 1

CMD ["node", "server.js"]