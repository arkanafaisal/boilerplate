FROM node:20 AS frontend-build
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


FROM node:20 AS app
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend .

COPY --from=frontend-build /frontend/dist ./dist

CMD ["npm", "run", "start"]



FROM flyway/flyway AS flyway
COPY ./backend/flyway/migrations /flyway/sql