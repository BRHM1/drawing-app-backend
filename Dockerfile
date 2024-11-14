FROM node:14.17.0-alpine3.13

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port and start application
EXPOSE 3000
CMD ["node" , "index.js"]