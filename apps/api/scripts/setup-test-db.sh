#!/bin/bash
# Setup Test Database
# Uses TEST_DATABASE_URL from .env to setup the test database safely

set -e

# Load .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$TEST_DATABASE_URL" ]; then
  echo "❌ TEST_DATABASE_URL is not set in .env"
  exit 1
fi

echo "🔧 Setting up test database..."

echo "📦 Running migrations..."
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy

echo "🌱 Seeding database..."
DATABASE_URL="$TEST_DATABASE_URL" npx prisma db seed

echo "✅ Test database setup complete!"

