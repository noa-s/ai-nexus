FROM node:22.20.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/ ./apps/
RUN npm ci
RUN npm run build --workspace @ai-nexus/api-edge
EXPOSE 3000
CMD ["node", "apps/api-edge/dist/src/server.js"]
