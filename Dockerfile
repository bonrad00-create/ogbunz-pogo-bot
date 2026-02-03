# Playwright base image includes Chromium + all Linux deps
FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./

# Skip downloading browsers during npm install (base image already has them)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# Fly doesn't require an HTTP port for a worker bot
ENV NODE_ENV=production

CMD ["npm","start"]
