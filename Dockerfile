# Etapa 1: Construcción
FROM oven/bun:latest AS build
WORKDIR /app

# CAMBIO AQUÍ: Usamos un comodín para que si no está el lockb, no explote
COPY package.json bun.lockb* ./

RUN bun install
COPY . .
RUN bun run build


# Etapa 2: Servidor de producción
FROM nginx:stable-alpine
# Si tu build genera 'dist', usa esta:
COPY --from=build /app/dist /usr/share/nginx/html
# SI TU BUILD GENERA 'build/client' (Remix), CAMBIA LA LÍNEA ANTERIOR POR:
# COPY --from=build /app/build/client /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]