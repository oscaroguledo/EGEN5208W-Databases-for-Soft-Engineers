# Development Dockerfile for Frontend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
COPY .npmrc* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose development port
EXPOSE 5173

# Environment variables for development
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:8000

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
