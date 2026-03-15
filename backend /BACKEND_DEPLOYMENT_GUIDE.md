# Quantify Backend Deployment Guide - Render

## Prerequisites
1. GitHub account with your repository pushed
2. Render account (sign up at https://render.com)
3. Groq API key (get from https://console.groq.com)

## Step-by-Step Deployment

### 1. Get Your Groq API Key
1. Go to https://console.groq.com
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. **Copy and save it** (you won't see it again!)

### 2. Deploy to Render

#### Option A: Using Blueprint (Recommended - Easier)
1. **Push your backend folder to GitHub**
   ```bash
   cd backend
   git add .
   git commit -m "Add application.properties and update render.yaml"
   git push
   ```

2. **Deploy via Render Dashboard**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select your `quantify` repository
   - Render will detect `render.yaml` automatically
   - Click "Apply"

3. **Set Environment Variables**
   After the services are created, you need to add the Groq API key:
   - Go to your `quantify-api` service
   - Click "Environment" in the left sidebar
   - Find `GROQ_API_KEY` 
   - Click "Edit" and paste your Groq API key
   - Click "Save Changes"
   - The service will automatically redeploy

#### Option B: Manual Service Creation
1. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `quantify-db`
   - Database Name: `quantify`
   - User: `quantify`
   - Region: Oregon (or closest to you)
   - Plan: Free
   - Click "Create Database"
   - **Save the Internal Database URL**

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `quantify` repo
   - Configure:
     - Name: `quantify-api`
     - Environment: Docker
     - Branch: main
     - Dockerfile Path: `./backend/Dockerfile`
     - Docker Context: `./backend`
     - Region: Oregon (same as database)
     - Plan: Free

3. **Set Environment Variables**
   Add these environment variables:
   ```
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=<paste-your-postgres-internal-url>
   JWT_SECRET=<click-generate-to-create-random-secret>
   GROQ_API_KEY=<paste-your-groq-api-key>
   GROQ_MODEL=llama-3.3-70b-versatile
   CORS_ORIGINS=https://quantify-trading.vercel.app
   ```

   Click "Create Web Service"

### 3. Verify Deployment

Once deployed, your API will be available at:
`https://quantify-api.onrender.com`

Test the health endpoint:
`https://quantify-api.onrender.com/api/insights/health`

### 4. Update Frontend Configuration

When deploying your frontend to Vercel, use this API URL:
```
VITE_API_URL=https://quantify-api.onrender.com
```

## Important Notes

### Free Tier Limitations
- Your service will spin down after 15 minutes of inactivity
- First request after spin-down takes ~1-2 minutes to wake up
- Database has 90-day expiration on free tier

### Groq API Configuration
The backend uses Groq with this model:
- Model: `llama-3.3-70b-versatile` (fast, intelligent, 128k context)
- Fallback: Ollama (local - only for development)
- If Groq fails, uses template-based responses

### Alternative Groq Models
You can change the model by updating `GROQ_MODEL`:
- `llama-3.3-70b-versatile` - Best for complex queries (default)
- `llama-3.1-8b-instant` - Fastest, good for simple queries
- `mixtral-8x7b-32768` - Good balance

### Database URL Format
Render provides internal database URL in this format:
```
postgresql://user:password@host:port/database
```

Make sure to use the **Internal Database URL**, not the External URL.

### Monitoring Your Deployment
- View logs: Service Dashboard → "Logs" tab
- Check metrics: Service Dashboard → "Metrics" tab
- Monitor database: Database Dashboard

### Common Issues

**Issue: Service won't start**
- Check logs for errors
- Verify DATABASE_URL is set correctly
- Ensure GROQ_API_KEY is valid

**Issue: Database connection failed**
- Use Internal Database URL (starts with `postgresql://`)
- Ensure database is in the same region as web service

**Issue: CORS errors from frontend**
- Verify CORS_ORIGINS includes your Vercel URL
- Add both with and without trailing slash

**Issue: Groq API errors**
- Check your API key is valid
- Verify you haven't exceeded rate limits
- Check Groq dashboard for status

## Next Steps
1. ✅ Deploy backend to Render
2. ⏭️ Deploy frontend to Vercel (we'll do this next!)
3. ⏭️ Update frontend API URL to point to Render
4. ⏭️ Test the full application

## Cost
Everything is **FREE** with these limitations:
- Backend: Free tier (750 hours/month)
- Database: Free tier (90 days, then need to upgrade or export data)
- Groq API: Free tier with rate limits

## Support
If you encounter issues:
1. Check Render logs
2. Check Groq API dashboard
3. Review error messages in browser console
