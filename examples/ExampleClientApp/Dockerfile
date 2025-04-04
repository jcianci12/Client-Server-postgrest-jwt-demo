# Stage 1: Compile and Build angular codebase
# Stage 2: Host the application using Nginx

# Use official node image as the base image
FROM node:latest as angularbuild

# Set the working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json .

# Install all the dependencies
RUN npm install
RUN npm install -g @angular/cli
# Copy the rest of your app's source code
COPY . .

# Build the angular app
RUN ng build --configuration "production"

# Stage 2: Host the application using Nginx
FROM nginx:latest
# Copy the dist folder to the nginx web root
COPY --from=angularbuild /app/dist/wsda /usr/share/nginx/html/wsda
# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4200
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

