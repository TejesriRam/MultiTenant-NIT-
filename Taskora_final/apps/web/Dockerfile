FROM node:20

WORKDIR /app

# Copy only the web app's package files (it has its own lock file)
COPY apps/web/package*.json ./

RUN npm install

# Copy the web app source
COPY apps/web/ ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]