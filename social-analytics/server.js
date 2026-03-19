const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY || '224fa5448a47d7fcebf2aa000a4096b3af95';
const WINDSOR_API_BASE = 'https://www.windsor.ai/api/v1';
const EMAIL_TO = 'drjr1021@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@social-dashboard.com';

// Gmail SMTP (configure via environment variables)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Account configurations
const ACCOUNTS = {
  facebook_organic: {
    connector: 'facebook_organic',
    account: '1078302752026769',
    name: 'Dead Pixel Design',
    displayName: 'Facebook',
    fields: ['date', 'page_impressions_organic_unique', 'page_post_engagements', 'page_fan_adds_unique']
  },
  instagram: {
    connector: 'instagram',
    account: '17841458799676829',
    name: 'Wretcher',
    displayName: 'Instagram',
    fields: ['date', 'reach_1d', 'impressions_1d', 'total_interactions', 'follower_count_1d']
  },
  tiktok_organic: {
    connector: 'tiktok_organic',
    account: '_000WJP1MokdiDhyoz723MrThO9UWtUIslQq',
    name: 'David William Russell III',
    displayName: 'TikTok',
    fields: ['date', 'reach', 'impressions', 'engagement', 'new_followers']
  },
  youtube: {
    connector: 'youtube',
    account: '5708',
    name: 'drjr1021@gmail.com',
    displayName: 'YouTube',
    fields: ['date', 'views', 'likes', 'comments', 'subscribers_gained']
  },
  snapchat: {
    connector: 'snapchat',
    account: 'dcbbfd98-4db3-427a-b359-6ec31336d12e',
    name: 'iOS In-App Promotions',
    displayName: 'Snapchat',
    fields: ['date', 'impressions', 'reach', 'engagement']
  },
  instagram_public: {
    connector: 'instagram_public',
    account: 'wretcher207',
    name: 'wretcher207',
    displayName: 'Instagram Public',
    fields: ['date', 'reach_1d', 'impressions_1d', 'total_interactions', 'follower_count_1d']
  }
};

// Fetch data from Windsor API
async function fetchWindsorData(platformKey) {
  const platform = ACCOUNTS[platformKey];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  try {
    const params = new URLSearchParams({
      connector: platform.connector,
      accounts: platform.account,
      fields: platform.fields.join(','),
      date_from: dateStr,
      date_to: dateStr,
      api_key: WINDSOR_API_KEY
    });

    const response = await fetch(`${WINDSOR_API_BASE}/connector?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`Windsor API error for ${platformKey}: ${response.statusText}`);
      return {
        platform: platformKey,
        displayName: platform.displayName,
        accountName: platform.name,
        error: 'API Error',
        data: null
      };
    }

    const data = await response.json();
    return {
      platform: platformKey,
      displayName: platform.displayName,
      accountName: platform.name,
      data: data.data || data,
      error: null
    };
  } catch (err) {
    console.error(`Error fetching data for ${platformKey}:`, err);
    return {
      platform: platformKey,
      displayName: platform.displayName,
      accountName: platform.name,
      error: err.message,
      data: null
    };
  }
}

// Calculate metrics
function calculateMetrics(platformData) {
  const { platform, data } = platformData;
  const metrics = {
    reach: 0,
    impressions: 0,
    engagement: 0,
    engagementRate: 0,
    followersGained: 0
  };

  if (!data || data.length === 0) return metrics;

  const row = data[0];

  if (platform === 'facebook_organic') {
    metrics.reach = row.page_impressions_organic_unique || 0;
    metrics.impressions = row.page_impressions_organic_unique || 0;
    metrics.engagement = row.page_post_engagements || 0;
    metrics.followersGained = row.page_fan_adds_unique || 0;
  } else if (platform === 'instagram' || platform === 'instagram_public') {
    metrics.reach = row.reach_1d || 0;
    metrics.impressions = row.impressions_1d || 0;
    metrics.engagement = row.total_interactions || 0;
    metrics.followersGained = row.follower_count_1d || 0;
  } else if (platform === 'tiktok_organic') {
    metrics.reach = row.reach || 0;
    metrics.impressions = row.impressions || 0;
    metrics.engagement = row.engagement || 0;
    metrics.followersGained = row.new_followers || 0;
  } else if (platform === 'youtube') {
    metrics.reach = row.views || 0;
    metrics.impressions = row.views || 0;
    metrics.engagement = (row.likes || 0) + (row.comments || 0);
    metrics.followersGained = row.subscribers_gained || 0;
  } else if (platform === 'snapchat') {
    metrics.reach = row.reach || 0;
    metrics.impressions = row.impressions || 0;
    metrics.engagement = row.engagement || 0;
    metrics.followersGained = 0;
  }

  metrics.engagementRate = metrics.reach > 0 
    ? ((metrics.engagement / metrics.reach) * 100).toFixed(2) 
    : 0;

  return metrics;
}

// Format numbers
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

// Generate HTML report
function generateHTMLReport(allResults) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  let cardsHTML = '';
  allResults.forEach(result => {
    const metrics = result.error ? null : calculateMetrics(result);
    
    if (result.error) {
      cardsHTML += `
        <div style="background: rgba(20, 25, 45, 0.8); border: 1px solid rgba(255, 100, 100, 0.2); border-radius: 12px; padding: 24px; margin: 20px 0;">
          <h2 style="color: #fff; margin-bottom: 8px;">${result.displayName}</h2>
          <div style="font-size: 12px; color: #888; margin-bottom: 16px;">${result.accountName}</div>
          <div style="background: rgba(255, 100, 100, 0.1); border: 1px solid rgba(255, 100, 100, 0.3); color: #ff9999; padding: 16px; border-radius: 8px; font-size: 13px;">
            ⚠️ ${result.error}
          </div>
        </div>
      `;
    } else {
      const engClass = metrics.engagementRate > 5 ? 'color: #88ff88;' : 'color: #88ddff;';
      const followClass = metrics.followersGained > 0 ? 'color: #88ff88;' : 'color: #ff6464;';

      cardsHTML += `
        <div style="background: rgba(20, 25, 45, 0.8); border: 1px solid rgba(255, 100, 100, 0.2); border-radius: 12px; padding: 24px; margin: 20px 0;">
          <h2 style="color: #fff; font-size: 18px; margin-bottom: 4px; font-weight: 600;">${result.displayName}</h2>
          <div style="font-size: 12px; color: #888; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">${result.accountName}</div>
          <div style="display: grid; gap: 14px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <span style="font-size: 12px; color: #aaa; text-transform: uppercase;">Reach</span>
              <span style="font-size: 18px; font-weight: 700; color: #88ddff;">${formatNumber(metrics.reach)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <span style="font-size: 12px; color: #aaa; text-transform: uppercase;">Impressions</span>
              <span style="font-size: 18px; font-weight: 700; color: #88ddff;">${formatNumber(metrics.impressions)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <span style="font-size: 12px; color: #aaa; text-transform: uppercase;">Engagement</span>
              <span style="font-size: 18px; font-weight: 700; color: #ff6464;">${formatNumber(metrics.engagement)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <span style="font-size: 12px; color: #aaa; text-transform: uppercase;">Engagement Rate</span>
              <span style="font-size: 18px; font-weight: 700; ${engClass}">${metrics.engagementRate}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span style="font-size: 12px; color: #aaa; text-transform: uppercase;">Followers Gained</span>
              <span style="font-size: 18px; font-weight: 700; ${followClass}">${formatNumber(metrics.followersGained)}</span>
            </div>
          </div>
        </div>
      `;
    }
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Social Dashboard</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          color: #e0e0e0;
          padding: 20px;
          margin: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          margin-bottom: 30px;
          border-bottom: 2px solid rgba(255, 100, 100, 0.3);
          padding-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 5px;
          color: #ff6464;
          font-weight: 700;
        }
        .date-time {
          color: #888;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Daily Social Dashboard</h1>
          <div class="date-time">Yesterday: ${dateStr}</div>
        </div>
        ${cardsHTML}
      </div>
    </body>
    </html>
  `;
}

// Send email with report
async function sendDailyReport() {
  console.log(`Generating report at ${new Date().toISOString()}`);

  try {
    // Fetch data from all platforms
    const promises = Object.keys(ACCOUNTS).map(key => fetchWindsorData(key));
    const allResults = await Promise.all(promises);

    // Generate HTML
    const htmlReport = generateHTMLReport(allResults);

    // Send email
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `Daily Social Dashboard - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html: htmlReport
    });

    console.log(`Report sent successfully to ${EMAIL_TO}`);
  } catch (err) {
    console.error('Error sending report:', err);
  }
}

// API endpoint to manually trigger report
app.post('/api/send-report', async (req, res) => {
  try {
    await sendDailyReport();
    res.json({ success: true, message: 'Report sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint to get current dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const promises = Object.keys(ACCOUNTS).map(key => fetchWindsorData(key));
    const allResults = await Promise.all(promises);

    const dashboardData = allResults.map(result => {
      const metrics = result.error ? null : calculateMetrics(result);
      return {
        platform: result.platform,
        displayName: result.displayName,
        accountName: result.accountName,
        error: result.error,
        metrics: metrics
      };
    });

    res.json(dashboardData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule daily report at 9 AM EST (14:00 UTC)
// Cron format: minute hour day month day-of-week
cron.schedule('0 14 * * *', () => {
  console.log('Running scheduled daily report...');
  sendDailyReport();
});

// For testing: also run on startup
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
  console.log('Daily report scheduled for 9 AM EST (2 PM UTC)');
});
