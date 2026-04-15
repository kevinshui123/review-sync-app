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

# Set production mode
# Cache buster - change this to force fresh build
ENV CACHE_BUST=20240414_1

# Copy package files
COPY package.json ./

# Copy prisma schema first (needed for postinstall)
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
# Force fresh install to avoid any stale cache
RUN npm install --force

# Install xhs CLI using uv
RUN uv tool install xiaohongshu-cli --python 3.11

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
ARG BUILD_DATE
RUN echo "Build triggered: $BUILD_DATE" && npm run build

# Expose Railway's forwarded port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "dist/server.js"]
