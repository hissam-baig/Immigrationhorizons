# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# public/uploads is where multer writes blog cover images and consultation
# documents (see middleware/upload.js, middleware/uploadDocument.js) - it
# needs to exist and be writable by the non-root user below, and should be
# mounted as a volume at runtime so uploads survive container restarts.
RUN mkdir -p public/uploads/resumes && chown -R node:node public/uploads

USER node
EXPOSE 3000
CMD ["node", "server.js"]
