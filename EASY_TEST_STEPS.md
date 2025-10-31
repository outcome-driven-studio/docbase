# Easy Steps to Test Slack Notifications

## After Deployment

### Step 1: Connect Slack (if not already)
1. Go to your app → **Account** → **Slack Integration** tab
2. Click **"Connect to Slack"**
3. Authorize the app
4. Select a notification channel from the dropdown

### Step 2: Click the Test Button
Right there in the Slack Integration section, you'll see:

**"Test Slack Connection"** button

Click it!

### What Happens:

**✅ Success:**
- Toast notification: "Test Successful! 🎉"
- Check your Slack channel - you'll see a test message!

**❌ Failed:**
- Toast will tell you exactly what's wrong:
  - "Slack not connected" → Connect Slack first
  - "Slack channel not selected" → Select a channel
  - "not_in_channel" → Invite bot to channel: `/invite @YourBot`
  - "invalid_auth" → Reconnect Slack

### Step 3: Test Real Notification
1. Create/open a document link
2. Access it (logged in or not)
3. Check Slack - you should get a notification!

## If Test Button Says It Works But You Still Don't Get Notifications

Check your hosting logs (Vercel, Railway, etc.) and look for:

```
[capture-viewer] Checking Slack notification...
[capture-viewer] Domain query result: { hasToken: true, hasChannel: true, ... }
[capture-viewer] Sending Slack notification...
[capture-viewer] Slack notification result: { success: true }
```

If you see:
```
[capture-viewer] Slack not configured - skipping notification
```

Then something is wrong with the database config. Run this SQL:

```sql
SELECT 
  slack_access_token IS NOT NULL as has_token,
  slack_channel_id IS NOT NULL as has_channel,
  slack_channel_name
FROM domains 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
```

Both must be TRUE.

## That's It!

The test button will tell you immediately if Slack is working or what's wrong.
