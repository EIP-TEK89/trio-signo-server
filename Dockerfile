# Base image
FROM node:23-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Create assets directory if it doesn't exist
RUN mkdir -p assets

# Generate prisma client
RUN npx prisma generate

# Creates a "dist" folder with the production build
RUN npm run build

# Start the server using the production build
CMD [ "node", "dist/src/main.js" ]