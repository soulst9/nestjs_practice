#!/bin/sh
set -e

# Change to application directory
cd /app
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
while ! nc -z mongodb 27017; do
  sleep 1
done
echo "MongoDB is ready!"

echo "Starting application..."
exec npm run start:prod
