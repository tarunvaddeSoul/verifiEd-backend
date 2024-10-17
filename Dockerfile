FROM node:20.11

WORKDIR /app

COPY package*.json ./

# Install dependencies and ajv-formats explicitly
RUN npm install

COPY . .

# For development mode, uncomment the below line
# CMD ["npm", "run", "start:dev"]

# Use environment variables from Docker Compose (defined as ARG)
ARG NESTJS_PORT
ARG INBOUND_PORT
ARG ADMIN_PORT

# Expose necessary ports for the NestJS app and agents
EXPOSE ${NESTJS_PORT}
EXPOSE ${INBOUND_PORT}
EXPOSE ${ADMIN_PORT}

# Command to start the application
CMD ["npm", "run", "start:prod"]


