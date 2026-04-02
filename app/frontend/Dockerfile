# Development Dockerfile for Frontend
FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc* ./

# Clear any cached node_modules and reinstall
RUN rm -rf node_modules package-lock.json && \
    npm install

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app
USER nextjs

# Expose development port
EXPOSE 5173

# Environment variables
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:8000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
