# Daily Social Dashboard Deployment Guide

## Overview
This backend automatically fetches your social media data from Windsor.ai every day at 9 AM EST and emails you a formatted report.

## Prerequisites
- A GitHub repository (public or private)
- A Render account (free tier works)
- Gmail account with app password enabled

## Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Create a new repository called `social-dashboard-backend`
3. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/social-dashboard-backend.git
   cd social-dashboard-backend
   ```

## Step 2: Add Files to Git

Copy these files to your repository:
- `server.js` (the backend code)
- `package.json` (dependencies)
- `.env.example` (template - DO NOT commit .env)
- Create a `.gitignore` file with:
  ```
  node_modules/
  .env
  .DS_Store
  ```

Then commit and push:
```bash
git add .
git commit -m "Initial commit: social dashboard backend"
git push origin main
```

## Step 3: Set Up Gmail App Password

Gmail has 2FA requirements for third-party apps:

1. Go to https://myaccount.google.com/security
2. Find "App passwords" (requires 2-factor authentication enabled)
3. Select "Mail" and "Windows Computer" (or your device)
4. Google generates a 16-character app password
5. **Copy this password** - you'll need it in Step 5

## Step 4: Deploy to Render

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub account and select the `social-dashboard-backend` repository
4. Configure the service:
   - **Name:** `social-dashboard-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (good enough for scheduled tasks)

5. Click "Create Web Service"

## Step 5: Add Environment Variables

In the Render dashboard for your service:

1. Go to "Environment" tab
2. Add these variables:
   ```
   WINDSOR_API_KEY=224fa5448a47d7fcebf2aa000a4096b3af95
   GMAIL_USER=drjr1021@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM=social-dashboard@noreply.com
   NODE_ENV=production
   ```

**Important:** Paste the 16-character Gmail app password you created in Step 3 (it has spaces, that's normal)

3. Click "Save"

## Step 6: Test the Deployment

Once deployed, Render will show you a URL like `https://social-dashboard-backend-xxx.onrender.com`

Test it:
1. Visit `https://social-dashboard-backend-xxx.onrender.com/health`
   - Should show: `{"status":"ok","timestamp":"..."}`

2. Manually trigger a test report:
   ```bash
   curl -X POST https://social-dashboard-backend-xxx.onrender.com/api/send-report
   ```
   
3. Check your email in 2-3 minutes for the dashboard report

## Step 7: Verify Automated Scheduling

The report will automatically run **every day at 9 AM EST** (2 PM UTC).

To confirm it's working:
- Check your email tomorrow at 9 AM
- You can view the cron log in Render's dashboard under "Logs"

## Troubleshooting

**"Email not sending"**
- Confirm the Gmail app password is correct (no typos)
- Check Render logs: go to Render dashboard → Service → Logs
- Verify 2FA is enabled on your Gmail account

**"Windsor API errors"**
- Check that all account IDs are correct
- Verify your Windsor API key is valid
- Check Render logs for the exact error

**"Wrong time for schedule"**
- The schedule is set to 9 AM EST (2 PM UTC)
- Render runs on UTC, so if you need a different time, let me know

## Managing the Service

- **View logs:** Render dashboard → Service → Logs
- **Stop service:** Render dashboard → Settings → Suspend
- **Update code:** Push changes to GitHub; Render auto-deploys
- **Update environment variables:** Edit in Render dashboard (no redeploy needed)

## API Endpoints

Your deployed service provides these endpoints:

- `GET /health` - Health check
- `POST /api/send-report` - Manually trigger report
- `GET /api/dashboard` - Get current dashboard data as JSON

Example:
```bash
curl https://social-dashboard-backend-xxx.onrender.com/api/dashboard
```

---

**Questions?** Check the Render logs for detailed error messages.
