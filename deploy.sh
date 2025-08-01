#!/bin/bash

echo "🚀 Recruitment Portal - Vercel Deployment Helper"
echo "================================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

echo "📦 Preparing for deployment..."

# Check if all required files exist
if [ ! -f "frontend/package.json" ]; then
    echo "❌ frontend/package.json not found"
    exit 1
fi

if [ ! -f "backend/main.py" ]; then
    echo "❌ backend/main.py not found"
    exit 1
fi

if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ backend/requirements.txt not found"
    exit 1
fi

echo "✅ All required files found"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🔧 Setting up environment variables..."
echo "Please set the following environment variables in Vercel:"
echo ""
echo "MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/recruitment_portal?retryWrites=true&w=majority"
echo "JWT_SECRET_KEY=your_super_secret_jwt_key_here_make_it_long_and_random"
echo "JWT_ALGORITHM=HS256"
echo "ACCESS_TOKEN_EXPIRE_MINUTES=30"
echo ""

echo "🚀 Ready to deploy!"
echo "Run 'vercel' to deploy your project"
echo ""
echo "After deployment, don't forget to:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Test all functionality"
echo "3. Configure custom domain (optional)" 