FROM node:10-alpine

WORKDIR /app
COPY . /app/
RUN yarn install --production

EXPOSE 8080

CMD ["npm", "start"]
