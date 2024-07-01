FROM node:alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY .env ./

RUN npm install

COPY . .

RUN npm run build

RUN npx prisma generate

FROM node:alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./
COPY --from=builder /app/prisma ./

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
