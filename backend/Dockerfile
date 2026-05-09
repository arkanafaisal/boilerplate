FROM node:20 AS app

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]


FROM flyway/flyway AS flyway
COPY ./flyway/migrations /flyway/sql