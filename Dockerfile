# Use Node.js 18 Alpine as base image
FROM node:18-alpine

ENV NEXT_TELEMETRY_DISABLED=1

# Set working directory
WORKDIR /app

# Install system dependencies including build tools
RUN apk add --no-cache \
    postgresql-client \
    openssl \
    python3 \
    make \
    g++ \
    libc6-compat

COPY package.json yarn.lock ./
RUN yarn install

# Copy the rest of the application code
COPY . .

# Set and verify environment variable before build
ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ENV NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
RUN echo "About to build with NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: $NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"

ARG POSTGRES_URI
ENV POSTGRES_URI=$POSTGRES_URI
RUN echo "About to build with POSTGRES_URI: $POSTGRES_URI"

# Build the Next.js application
RUN yarn build

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"

CMD ["tail", "-f", "/dev/null"]