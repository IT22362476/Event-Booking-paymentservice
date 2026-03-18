# Use Node.js official image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 8080

# Command to run the application
CMD ["node", "index.js"]