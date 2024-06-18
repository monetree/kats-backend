FROM node:18-alpine as base

WORKDIR /src
COPY package*.json ./
EXPOSE 4000

FROM base as production
ENV NODE_ENV=production
RUN npm ci
COPY . /src

CMD ["/bin/sh", "npm start"]
