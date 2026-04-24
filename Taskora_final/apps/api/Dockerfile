FROM node:20

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages ./packages

RUN npm install

# Generate Prisma client from schema
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]