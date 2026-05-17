FROM node:20 AS frontend-build
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


FROM node:22 AS app
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend .

COPY --from=frontend-build /frontend/dist ./public

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG SHADOW_DATABASE_URL
ENV SHADOW_DATABASE_URL=$SHADOW_DATABASE_URL
RUN npx prisma generate

RUN npm run build

CMD ["npm", "run", "start"]