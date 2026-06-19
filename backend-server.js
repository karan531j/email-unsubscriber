/**
 * Email Unsubscribe Manager - Backend Server
 * Handles OAuth, email analysis, and automated unsubscribes
 * 
 * Deploy to: Heroku, Vercel, AWS, or your own server
 * 
 * Environment variables needed:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - MICROSOFT_CLIENT_ID
 * - MICROSOFT_CLIENT_SECRET
 * - JWT_SECRET
 * - DATABASE_URL (for MongoDB)
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// SECTION 1: OAuth & Authentication
// ============================================

// Google OAuth
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL}/auth/google/callback`
);

// Generate auth URL
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
  });
  res.json({ authUrl });
});

// Handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Create JWT token for frontend
    const jwtToken = jwt.sign(
      { 
        type: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}?token=${jwtToken}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SECTION 2: Email Analysis
// ============================================

app.post('/api/analyze-emails', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    oauth2Client.setCredentials({
      access_token: decoded.accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch promotional emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'category:promotions OR category:social is:unread',
      maxResults: 100,
    });

    const messages = response.data.messages || [];
    const senders = {};

    // Parse each email to find unsubscribe links
    for (const message of messages.slice(0, 50)) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      const headers = msg.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';

      // Extract email address from "Name <email@domain>" format
      const emailMatch = from.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const senderEmail = emailMatch ? emailMatch[1] : from;

      if (!senders[senderEmail]) {
        senders[senderEmail] = {
          email: senderEmail,
          name: from.split('<')[0].trim(),
          count: 0,
          unsubscribeLink: extractUnsubscribeLink(msg.data),
          unsubscribeEmail: null,
        };
      }

      senders[senderEmail].count += 1;
    }

    // Categorize senders
    const categorized = categorizeSenders(Object.values(senders));

    res.json({
      status: 'success',
      data: categorized,
      totalEmails: messages.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extract unsubscribe link from email body
function extractUnsubscribeLink(message) {
  const parts = message.payload.parts || [message.payload];
  
  for (const part of parts) {
    if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
      const data = Buffer.from(part.body.data || '', 'base64').toString();
      
      // Look for common unsubscribe patterns
      const patterns = [
        /href=["'](.*?unsubscribe.*?)["']/gi,
        /(http[s]?:\/\/[^\s]+unsubscribe[^\s]*)/gi,
        /unsubscribe.*?href=["'](.*?)["']/gi,
      ];

      for (const pattern of patterns) {
        const match = data.match(pattern);
        if (match) {
          return match[0];
        }
      }
    }
  }

  return null;
}

// Categorize senders into tiers
function categorizeSenders(senders) {
  const categories = {
    tier1: { name: 'E-commerce & Shopping', senders: [] },
    tier2: { name: 'Services & Restaurants', senders: [] },
    tier3: { name: 'SaaS & Tools', senders: [] },
    tier4: { name: 'Education & Other', senders: [] },
  };

  const keywords = {
    ecommerce: ['adidas', 'ebay', 'amazon', 'shop', 'store', 'sale', 'discount', 'warehouse'],
    restaurant: ['food', 'restaurant', 'café', 'deliveroo', 'uber eats'],
    saas: ['app', 'tool', 'software', 'platform', 'service', 'emma', 'paperpal'],
    education: ['course', 'learn', 'university', 'school', 'training', 'gre'],
  };

  senders.forEach(sender => {
    const name = sender.name.toLowerCase();
    const email = sender.email.toLowerCase();
    const searchText = `${name} ${email}`;

    let tier = 'tier4';

    if (keywords.ecommerce.some(kw => searchText.includes(kw))) {
      tier = 'tier1';
    } else if (keywords.restaurant.some(kw => searchText.includes(kw))) {
      tier = 'tier2';
    } else if (keywords.saas.some(kw => searchText.includes(kw))) {
      tier = 'tier3';
    } else if (keywords.education.some(kw => searchText.includes(kw))) {
      tier = 'tier4';
    }

    categories[tier].senders.push(sender);
  });

  return categories;
}

// ============================================
// SECTION 3: Automated Unsubscribe
// ============================================

app.post('/api/unsubscribe', async (req, res) => {
  try {
    const { token, sendersToUnsubscribe } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    oauth2Client.setCredentials({
      access_token: decoded.accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    for (const sender of sendersToUnsubscribe) {
      try {
        // Method 1: Try to use unsubscribe link (one-click)
        if (sender.unsubscribeLink) {
          await visitUnsubscribeLink(sender.unsubscribeLink);
          results.success += 1;
          results.details.push({
            sender: sender.email,
            method: 'link',
            status: 'success'
          });
        }
        // Method 2: Send email-based unsubscribe
        else if (sender.unsubscribeEmail) {
          await sendUnsubscribeEmail(sender.unsubscribeEmail);
          results.success += 1;
          results.details.push({
            sender: sender.email,
            method: 'email',
            status: 'success'
          });
        }
        // Method 3: Mark all emails as archived/deleted
        else {
          await archiveFromSender(gmail, sender.email);
          results.skipped += 1;
          results.details.push({
            sender: sender.email,
            method: 'archive',
            status: 'archived'
          });
        }
      } catch (error) {
        results.failed += 1;
        results.details.push({
          sender: sender.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      status: 'completed',
      results,
      message: `Processed ${sendersToUnsubscribe.length} senders: ${results.success} unsubscribed, ${results.skipped} archived, ${results.failed} failed`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Method 1: Visit unsubscribe link using Puppeteer
async function visitUnsubscribeLink(url) {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Look for confirmation button and click it
    const confirmBtn = await page.$('button[type="submit"]') ||
                       await page.$('input[type="submit"]') ||
                       await page.$('a[href*="confirm"]');
    
    if (confirmBtn) {
      await confirmBtn.click();
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
    }
    
    return true;
  } finally {
    await browser.close();
  }
}

// Method 2: Send email-based unsubscribe
async function sendUnsubscribeEmail(email) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.UNSUBSCRIBE_EMAIL,
      pass: process.env.UNSUBSCRIBE_PASSWORD,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: 'Unsubscribe',
    text: 'Please unsubscribe me from your mailing list.',
  });

  return true;
}

// Method 3: Archive all emails from sender
async function archiveFromSender(gmail, senderEmail) {
  const messages = await gmail.users.messages.list({
    userId: 'me',
    q: `from:${senderEmail}`,
  });

  if (messages.data.messages) {
    for (const msg of messages.data.messages) {
      await gmail.users.messages.modify({
        userId: 'me',
        id: msg.id,
        requestBody: {
          addLabelIds: ['ARCHIVE'],
          removeLabelIds: ['INBOX'],
        },
      });
    }
  }
}

// ============================================
// SECTION 4: Delete Promotional Emails
// ============================================

app.post('/api/delete-promotions', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    oauth2Client.setCredentials({
      access_token: decoded.accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Find all unread promotional emails
    const messages = await gmail.users.messages.list({
      userId: 'me',
      q: 'category:promotions is:unread',
      maxResults: 500,
    });

    let deleted = 0;

    if (messages.data.messages) {
      for (const msg of messages.data.messages) {
        await gmail.users.messages.trash({
          userId: 'me',
          id: msg.id,
        });
        deleted += 1;
      }
    }

    res.json({
      status: 'success',
      deleted,
      message: `Deleted ${deleted} promotional emails`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SECTION 5: Server Setup
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Email Unsubscriber API running on port ${PORT}`);
  console.log(`📧 Ready to analyze emails and unsubscribe`);
});

module.exports = app;

/**
 * DEPLOYMENT CHECKLIST:
 * 
 * 1. Set environment variables:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - MICROSOFT_CLIENT_ID (future)
 *    - JWT_SECRET
 *    - BACKEND_URL
 *    - FRONTEND_URL
 * 
 * 2. Install dependencies:
 *    npm install express cors jwt googleapis nodemailer puppeteer mailparser
 * 
 * 3. Deploy to Heroku/Vercel/AWS
 * 
 * 4. Test endpoints with Postman:
 *    - GET /auth/google
 *    - POST /api/analyze-emails
 *    - POST /api/unsubscribe
 *    - POST /api/delete-promotions
 */
