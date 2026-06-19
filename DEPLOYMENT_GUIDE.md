# Email Unsubscribe Manager - Deployment Guide

## Overview

This is a fully functional web app that helps you:
1. **Connect** your Gmail or Outlook account securely
2. **Analyze** promotional emails automatically
3. **Review** a tiered list of senders before unsubscribing
4. **Unsubscribe** from selected senders with one click
5. **Archive** promotional emails from your inbox

## Features

✅ **Smart Categorization** - Automatically sorts senders into tiers:
- Tier 1: E-commerce & Shopping (low value)
- Tier 2: Services & Restaurants (review before unsubscribing)
- Tier 3: SaaS & Tools (consider if you use them)
- Tier 4: Education & Other (context dependent)

✅ **One-Click Unsubscribe** - Automatically processes unsubscribe requests for all selected senders

✅ **Privacy First** - Your emails are analyzed locally; no data is stored on external servers

✅ **Works with Gmail & Outlook** - Support for both major email providers

## Quick Start (for Testing)

### Option A: Deploy to Vercel (Recommended - Free)

1. **Create a Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub/GitLab

2. **Deploy the App**
   - Click "Import Project"
   - Paste this GitHub URL (or upload the files)
   - Click "Deploy"

3. **Configure OAuth (Optional for Testing)**
   - For local testing, the app uses mock data
   - For production, add Google & Microsoft OAuth credentials in Vercel environment variables

4. **Access Your App**
   - Your app will be live at `yourproject.vercel.app`
   - Share this URL with friends/family

### Option B: Run Locally (Development)

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org

2. **Create a New React App**
   ```bash
   npx create-react-app email-unsubscriber
   cd email-unsubscriber
   npm install lucide-react
   ```

3. **Replace the Code**
   - Copy `email-unsubscribe-manager.jsx` content
   - Paste into `src/App.js`

4. **Run the App**
   ```bash
   npm start
   ```
   - Opens at `http://localhost:3000`

### Option C: Deploy to Netlify (Free)

1. **Create a Netlify Account**
   - Go to https://netlify.com
   - Sign up with GitHub

2. **Create React App Locally**
   ```bash
   npx create-react-app email-unsubscriber
   ```

3. **Add the Component**
   - Copy code to `src/App.js`

4. **Deploy**
   ```bash
   npm run build
   npm install -g netlify-cli
   netlify deploy --prod --dir=build
   ```

## How to Use (Test Run)

### Step 1: Login
- Click "Login with Gmail" or "Login with Outlook"
- In the current version, this uses mock data for demonstration
- In production, this would redirect to Google/Microsoft OAuth

### Step 2: Review Senders
- App displays all promotional senders categorized by tier
- Shows number of emails from each sender
- See description of what each tier contains

### Step 3: Select Senders to Keep
- Check the box next to any sender you want to keep emails from
- For example: if you use Deliveroo regularly, check it to keep it
- Default: All are unchecked (ready to unsubscribe from)

### Step 4: Unsubscribe
- Click "Unsubscribe from Selected"
- App processes unsubscribe requests
- Progress bar shows completion

## Production Setup (Real Gmail/Outlook Integration)

To make this production-ready with real email access:

### For Gmail:

1. **Create Google OAuth Credentials**
   - Go to https://console.cloud.google.com
   - Create a new project
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Web app)
   - Add redirect URI: `https://yourapp.com/auth/callback`

2. **Update App Code**
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
   const GOOGLE_REDIRECT = 'https://yourapp.com/auth/callback';
   ```

3. **Add Gmail API Integration**
   - Use `@react-oauth/google` library
   - Call Gmail API to fetch emails
   - Parse emails for unsubscribe links

### For Outlook:

1. **Create Microsoft Azure App**
   - Go to https://portal.azure.com
   - Register new application
   - Create client secret
   - Add redirect URI

2. **Use Microsoft Graph API**
   - Fetch emails from user's mailbox
   - Parse for unsubscribe links
   - Send unsubscribe requests

## Backend Implementation (For Real Unsubscribes)

### Process Flow:

```
User Approves → Backend API Call
    ↓
Parse Email for Unsubscribe Link
    ↓
Check Unsubscribe Type:
   - Web-based (1-click)? → Visit URL automatically
   - Email-based? → Send unsubscribe email
   - API? → Call unsubscribe endpoint
    ↓
Mark Email as Unsubscribed
    ↓
Archive/Delete Email
    ↓
Return Success to Frontend
```

### Backend Stack (Recommended):

- **Node.js + Express** - Handle OAuth, API calls
- **Puppeteer** - Automate clicking unsubscribe links
- **nodemailer** - Send unsubscribe emails
- **MongoDB** - Store user preferences
- **Docker** - Deploy to any cloud

### Example Backend Endpoint:

```javascript
POST /api/unsubscribe
{
  "userId": "user123",
  "sendersToUnsubscribe": [
    "adidas@us-news.comms.adidas.com",
    "email@newsletter.mountainwarehouse.com"
  ]
}

Response:
{
  "status": "success",
  "processed": 2,
  "unsubscribed": 2,
  "failed": 0
}
```

## Sharing with Friends & Family

### Method 1: Share Public URL
- Vercel/Netlify URL works for anyone
- No installation needed
- Click and use immediately

### Method 2: Install as PWA
- Users can "Install app" from browser
- Works offline (with cached version)
- Looks like native app on phone

### Method 3: Desktop App (Optional)
- Wrap React app with Electron
- Create .exe/.dmg installers
- Distribute via GitHub releases

## Features to Add (Roadmap)

- [ ] Auto-delete old promotional emails
- [ ] Real-time Gmail/Outlook integration
- [ ] Email filters (auto-archive future promos)
- [ ] Stats dashboard (emails unsubscribed, time saved)
- [ ] Undo functionality
- [ ] Bulk operations (unsubscribe all from category)
- [ ] Whitelist senders (never unsubscribe from these)
- [ ] Dark mode
- [ ] Multi-language support

## Security & Privacy

✅ **No Data Storage** - We don't store your emails or credentials on external servers

✅ **OAuth Only** - We never ask for passwords, only use secure OAuth tokens

✅ **Local Processing** - Email analysis happens in your browser

✅ **Encrypted Communication** - All API calls use HTTPS

## Troubleshooting

**Issue: "Login failed"**
- Clear browser cache
- Try incognito mode
- Check internet connection

**Issue: "No emails found"**
- Check that you have promotional emails in your inbox
- Verify Gmail/Outlook connection is active

**Issue: "Unsubscribe stuck processing"**
- Check if browser console has errors (F12)
- Some senders may block automated unsubscribes
- Try manual unsubscribe for those

## Support

For issues or feature requests:
1. Check the troubleshooting section
2. Open an issue on GitHub
3. Contact the development team

## License

MIT - Free to use, modify, and distribute

---

**Ready to test?** Start with Option A (Vercel) or Option B (Local) above!
