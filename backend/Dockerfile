# CampusLend Backend Dockerfile
# Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (production & dev for prisma generation)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "src/index.js"]
