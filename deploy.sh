#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create necessary directories
echo "📂 Setting up directories..."
mkdir -p netlify/functions

# Install function dependencies
echo "📦 Installing function dependencies..."
cd netlify/functions
npm install --production
cd ../..

echo "✅ Build completed successfully!"
echo "🚀 Ready for deployment to Netlify"
