# Dockerfile dla aplikacji frontend Knowledge Assistant
# Wieloetapowy build: budowanie aplikacji React i serwowanie przez Nginx

# ETAP 1: Budowanie aplikacji React
FROM node:20-alpine AS builder

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików konfiguracyjnych npm (dla cache'owania warstw)
COPY package.json ./
COPY package-lock.json ./

# Instalacja zależności npm
RUN npm install

# Kopiowanie kodu źródłowego aplikacji
COPY src ./src

# Kopiowanie zasobów publicznych (ikony, manifest, itp.)
COPY public ./public

# Kopiowanie pozostałych plików konfiguracyjnych
COPY tsconfig.json ./

# Opcjonalny sleep dla debugowania - można odkomentować w razie potrzeby
# RUN echo "Entering debug mode. Connect with 'docker exec -it <container_id> sh'" && sleep 9999

# Budowanie aplikacji React do produkcji
RUN npm run build

# ETAP 2: Serwowanie aplikacji przez Nginx
FROM nginx:alpine

# Kopiowanie konfiguracji Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiowanie zbudowanej aplikacji z etapu builder
COPY --from=builder /app/build /usr/share/nginx/html

# Eksponowanie portu 80 dla HTTP
EXPOSE 80

# Uruchomienie Nginx w trybie foreground
CMD ["nginx", "-g", "daemon off;"]
