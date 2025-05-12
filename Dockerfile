FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "dev"]

# docker build -t personal-blog-frontend .
# docker run -p 3000:3000 personal-blog-frontend