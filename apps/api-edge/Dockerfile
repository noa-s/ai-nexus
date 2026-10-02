FROM node:22.20.0-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
COPY test ./test
RUN npm ci --ignore-scripts
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
