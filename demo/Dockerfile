FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ARG APP_PORT=3000
ENV PORT=${APP_PORT}

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]