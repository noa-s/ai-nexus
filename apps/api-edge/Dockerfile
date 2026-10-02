FROM node:22.20.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api-edge/package.json apps/api-edge/tsconfig.json ./apps/api-edge/
COPY apps/api-edge/src ./apps/api-edge/src
COPY apps/api-edge/test ./apps/api-edge/test
RUN npm ci
RUN echo "=== workspace dependency diagnostics ===" \
    && npm ls typescript --all \
    && echo "=== node_modules/.bin ===" \
    && ls -la node_modules/.bin \
    && echo "=== TypeScript executable ===" \
    && node_modules/.bin/tsc --version \
    && echo "=== workspace TypeScript executable ===" \
    && npm exec --workspace @ai-nexus/api-edge -- tsc --version
RUN npm run build --workspace @ai-nexus/api-edge
EXPOSE 3000
CMD ["node", "apps/api-edge/dist/src/server.js"]
