FROM node:24-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium \
    && chmod -R a+rX /ms-playwright \
    && rm -rf /var/lib/apt/lists/*
COPY apps/web ./apps/web
COPY infra/postgres ./infra/postgres
COPY content/lessons ./content/lessons
COPY Backend_Course_Program_Requirements.md ./
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 3000
USER node
CMD ["node", "apps/web/server.mjs"]
