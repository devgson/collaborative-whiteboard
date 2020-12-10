# Specifies where to get the base image (Node v12 in our case) and creates a new container for it
FROM node:8.12.0

# Set working directory. Paths will be relative this WORKDIR.
# WORKDIR /app
WORKDIR /usr/src/app

# install and cache app dependencies
# COPY package.json /app/package.json
COPY package*.json ./


RUN npm install

RUN npm install -g pm2

# Copy source files from host computer to the container
COPY . .

# Specify port app runs on
EXPOSE 3000

# Run the app
CMD [ "npm", "start" ]