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

# Expose port
EXPOSE 3000

# Start: push schema then run server
# Railway injects DATABASE_URL and APP_URL as environment variables
# --accept-data-loss is safe: only drops a new compound unique index
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
