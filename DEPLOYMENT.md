# Deployment Guide for Vercel

This guide will help you deploy your Recruitment Portal to Vercel for free.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas**: Set up a free MongoDB Atlas cluster

## Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Connect GitHub Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root of your project)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     ```
     MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/recruitment_portal?retryWrites=true&w=majority
     JWT_SECRET_KEY=your_super_secret_jwt_key_here_make_it_long_and_random
     JWT_ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=30
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET_KEY
   vercel env add JWT_ALGORITHM
   vercel env add ACCESS_TOKEN_EXPIRE_MINUTES
   ```

## Step 3: Configure Custom Domain (Optional)

1. Go to your project dashboard on Vercel
2. Navigate to Settings → Domains
3. Add your custom domain
4. Update your DNS settings as instructed

## Step 4: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. Test the following functionality:
   - User registration and login
   - Job creation and management
   - Candidate management
   - Search and filter functionality

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure Python version is compatible (3.11)
   - Verify all import paths are correct

2. **API Errors**:
   - Check that environment variables are set correctly
   - Verify MongoDB connection string
   - Ensure CORS is configured properly

3. **Frontend Not Loading**:
   - Check that the build output is in the correct directory
   - Verify that the API base URL is correct
   - Check browser console for errors

### Environment Variables Reference:

```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Optional (with defaults)
JWT_SECRET_KEY=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Free Tier Limitations

- **Bandwidth**: 100GB/month
- **Function Execution**: 100GB-hours/month
- **Build Time**: 100 minutes/day
- **Custom Domains**: Unlimited
- **Team Members**: Unlimited

## Monitoring and Analytics

1. **Vercel Analytics**: Automatically enabled for performance monitoring
2. **Function Logs**: Available in the Vercel dashboard
3. **Error Tracking**: Built-in error reporting

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: Configured to allow only necessary origins
3. **JWT**: Use strong, unique secret keys
4. **MongoDB**: Use connection string with authentication

## Performance Optimization

1. **Image Optimization**: Vercel automatically optimizes images
2. **Caching**: Static assets are cached automatically
3. **CDN**: Global CDN for fast loading
4. **Serverless Functions**: Automatic scaling based on demand

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com) 