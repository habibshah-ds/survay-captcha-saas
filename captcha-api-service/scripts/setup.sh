#!/bin/bash

echo "🚀 CAPTCHA API Service Setup"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate secure ALTCHA secret
    ALTCHA_SECRET=$(openssl rand -hex 32)
    sed -i "s/your-secure-random-secret-here-change-in-production/$ALTCHA_SECRET/" .env
    
    echo "✅ .env file created with secure ALTCHA secret"
else
    echo "⚠️  .env file already exists, skipping creation"
fi

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
docker-compose exec -T app npm run migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Service is running at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/api/v1/health"
echo ""
echo "📋 Test API Key: test_api_key_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd"
echo ""
echo "📜 View logs: docker-compose logs -f app"
echo "🛑 Stop services: docker-compose down"
