FROM node:18

ENV VITE_API_BASE_URL=/api

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "dev"]
