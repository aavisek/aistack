FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY apps/web ./apps/web
COPY infra/postgres ./infra/postgres
COPY content/lessons ./content/lessons
COPY Backend_Course_Program_Requirements.md ./
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 3000
USER node
CMD ["node", "apps/web/server.mjs"]
