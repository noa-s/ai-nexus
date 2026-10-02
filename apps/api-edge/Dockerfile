FROM node:22.20.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api-edge/package.json apps/api-edge/tsconfig.json ./apps/api-edge/
COPY apps/api-edge/src ./apps/api-edge/src
COPY apps/api-edge/test ./apps/api-edge/test
RUN npm ci
RUN echo "=== workspace dependency diagnostics ===" \
    && npm ls typescript --all \
    && echo "=== root node_modules/.bin ===" \
    && (ls -la node_modules/.bin || true) \
    && echo "=== workspace node_modules/.bin ===" \
    && (ls -la apps/api-edge/node_modules/.bin || true) \
    && echo "=== workspace TypeScript package ===" \
    && (ls -la apps/api-edge/node_modules/typescript/bin/tsc || true) \
    && echo "=== npm exec workspace TypeScript ===" \
    && npm exec --workspace @ai-nexus/api-edge -- tsc --version
RUN npm --workspace @ai-nexus/api-edge run build
EXPOSE 3000
CMD ["node", "apps/api-edge/dist/src/server.js"]
