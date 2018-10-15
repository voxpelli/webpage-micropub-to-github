FROM node:10-alpine

WORKDIR /app
COPY . /app/
RUN yarn install

EXPOSE 8080

ENTRYPOINT ["node"]
CMD ["."]
