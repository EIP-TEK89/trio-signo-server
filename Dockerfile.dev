# Use the official image as a parent image
FROM node:23.8-alpine3.20

# Set the working directory
WORKDIR /usr/src/app

# Copy the file from your host to your current location
COPY package*.json ./
COPY prisma ./prisma/

# Install any needed packages specified in package.json
RUN npm install

# Generate Prisma Client 
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Inform Docker that the container is listening on the specified port at runtime.
EXPOSE 3000

# Run the specified command within the container. Dev mode
CMD ["npm", "run", "start:dev"]
