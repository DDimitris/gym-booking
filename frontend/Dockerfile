FROM node:20-alpine as build
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy rest of the application
COPY . .

# Build the application
RUN npm run build

# Use stable nginx version for production
FROM nginx:1.24-alpine
RUN addgroup -S web && adduser -S web -G web
# Install wget for healthchecks and prepare writable dirs for non-root nginx
RUN apk add --no-cache wget && \
    mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx && \
    chown -R web:web /var/cache/nginx /var/run/nginx /var/log/nginx && \
    rm -rf /var/cache/apk/*

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist/gym-booking-app/browser/ /usr/share/nginx/html/
USER root

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:80/ || exit 1

EXPOSE 80