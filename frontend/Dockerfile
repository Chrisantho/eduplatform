# Frontend Dockerfile

# Stage 1: Build app with Node
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all frontend source code (relative to context ./frontend)
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the custom nginx config (relative to ./frontend)
COPY nginx.conf /etc/nginx/nginx.conf
# Copy built frontend from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]