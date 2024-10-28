FROM node:21-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and lock file to install dependencies
COPY package*.json pnpm-lock.yaml ./

# Install dependencies, including dev dependencies
RUN npm install -g pnpm && pnpm install

# Copy all project files, including `tsconfig.json`
COPY . .

# Run the TypeScript and Vite builds
RUN pnpm run build

# Expose the Vite port
EXPOSE 5173

# Start the app
CMD ["pnpm", "run", "start"]