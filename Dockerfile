FROM node:18.13.0-bullseye-slim AS build
WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci
COPY . .
RUN npm run build && npm run bundle

FROM node:18.13.0-bullseye-slim
WORKDIR /app
COPY package.json /app/package.json
RUN npm install --omit=dev
COPY --from=build /app/dist/app.cjs /app/app.cjs
CMD ["node", "app.cjs"]
