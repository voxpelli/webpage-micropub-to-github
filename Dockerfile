FROM node:10-alpine

WORKDIR /app
COPY . /app/
RUN npm install

EXPOSE 8080

CMD ["npm", "start"]
