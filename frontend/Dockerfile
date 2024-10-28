# Dockerfile for frontend (React with pnpm)
FROM node:21.7.3

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN npm ci
ENV NODE_ENV=production
RUN npm run build

COPY . .

EXPOSE 5173
CMD ["npm", "run", "start"]