# Etapa 1: Construcción con Bun
FROM oven/bun:latest AS build
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

# Etapa 2: Servidor de producción (Nginx)
FROM nginx:stable-alpine
# Para Remix/Vite, la carpeta de salida suele ser /build/client o /dist
COPY --from=build /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]