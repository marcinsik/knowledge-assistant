# knowledge-assistant/frontend/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app
COPY . .
COPY package.json ./
COPY package-lock.json ./

RUN npm install

# *** ZMIANA TUTAJ: BARDZO SELEKTYWNE KOPIOWANIE Z 'src' ***
# Kopiuj kluczowe pliki z src indywidualnie
COPY src/App.tsx ./src/App.tsx
COPY src/index.tsx ./src/index.tsx
COPY src/App.css ./src/App.css
COPY src/logo.svg ./src/logo.svg
COPY src/index.css ./src/index.css

# Jeśli masz inne pliki w 'src' (np. reportWebVitals.tsx, setupTests.tsx, react-app-env.d.ts)
# Musisz je dodać osobno, np.:
# COPY src/reportWebVitals.ts ./src/reportWebVitals.ts
# COPY src/setupTests.ts ./src/setupTests.ts


# Kopiuj katalog public
COPY public ./public

# Opcjonalnie: ponownie dodaj sleep dla debugowania, jeśli chcesz potwierdzić pliki
# RUN echo "Entering debug mode. Connect with 'docker exec -it <container_id> sh'" && sleep 9999

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]