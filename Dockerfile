FROM node:12-alpine

RUN apk add --update git make gcc g++ python linux-headers udev curl && rm -rf /var/cache/apk/*

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

# NodeJS dependencies
COPY package*.json /usr/src/app/
RUN npm ci

COPY . /usr/src/app

EXPOSE 3000 8080
CMD [ "npm", "start" ]