FROM node:18

WORKDIR /app

COPY package*.json ./
npm ci --only=production

COPY . .

CMD ["node", "index.js"]
