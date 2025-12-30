FROM node:18-alpine AS builder

WORKDIR /usr/src/app


# 1. Copy package files
COPY package*.json ./
COPY prisma ./prisma/


# 2. Install ALL dependencies (including dev)
RUN npm ci

# 3. Copy the rest of the application code
COPY . .


# 4. Build the application
RUN npm run build


# 5. Generate Prisma client
RUN npx prisma generate



# ============ STAGE 2: Runner ============
FROM node:18-alpine AS runner

WORKDIR /usr/src/app


# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

# Copy Prisma schema and generated client
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001 -G nodejs

# 3. Copy built files
COPY --from=builder /app/dist ./dist

# 4. Set correct ownership
RUN chown -R nestjs:nodejs /app


# 5. Switch to non-root user
USER nestjs


EXPOSE 3000

CMD ["node", "dist/main.js"]
