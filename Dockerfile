# Use a lightweight, official Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# do this before copying the rest of the code to cache the npm install step!
COPY package*.json ./
RUN npm install

# Copy all source code into the container
COPY . .

# Expose the port app runs on
EXPOSE 3000

# The command to start your backend
CMD ["npm", "start"]