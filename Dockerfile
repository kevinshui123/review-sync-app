# Use Node.js 20 as base
FROM node:20-slim

# Install system dependencies including Python and uv
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install uv for Python package management
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (without native optional deps)
RUN npm install --ignore-scripts

# Install xhs CLI using uv
RUN uv tool install xiaohongshu-cli --python 3.11

# Copy source code
COPY . .

# Generate Prisma client (no DB connection needed)
RUN npx prisma generate

# Build the app
RUN npm run build

# Expose port (Railway uses PORT env var)
ENV PORT=8080
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start: just run server (assume DB schema is up to date)
CMD ["node", "dist/server.js"]
