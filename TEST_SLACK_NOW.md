# Test Slack Notifications Right Now

I've added detailed logging and a test endpoint. Let's figure this out quickly.

## Step 1: Deploy the New Code

```bash
cd /Users/anirudhmadhavan/repos/docbase

# Add all the changes
git add -A

# Commit
git commit -m "Add detailed Slack debugging and test endpoint"

# Push
git push origin ani-contrib/api
```

Wait for deployment to complete.

## Step 2: Run the Test Endpoint

After deployment, open this URL in your browser (while logged in):

```
https://YOUR_APP_URL/api/test-slack
```

### What you'll see:

**✅ If working correctly:**
```json
{
  "success": true,
  "message": "Test notification sent successfully! Check your Slack channel.",
  "debug": {
    "userId": "...",
    "userEmail": "your@email.com",
    "channelId": "C123456",
    "channelName": "general",
    "teamName": "Your Workspace"
  }
}
```
→ Check Slack, you should see the test message!

**❌ If Slack not connected:**
```json
{
  "error": "Slack not connected",
  "message": "Go to Account → Slack Integration → Connect to Slack"
}
```
→ Go connect Slack first

**❌ If channel not selected:**
```json
{
  "error": "Slack channel not selected",
  "message": "Go to Account → Slack Integration → Select a channel"
}
```
→ Go select a channel

**❌ If Slack API fails:**
```json
{
  "success": false,
  "error": "Failed to send Slack notification",
  "slackError": "not_in_channel" // or other error
}
```
→ See troubleshooting below

## Step 3: Check Server Logs

After you access a document link, check your hosting platform logs:

**Look for these console.log messages:**
```
[capture-viewer] Starting request
[capture-viewer] Checking Slack notification...
[capture-viewer] Link creator: <uuid>
[capture-viewer] Domain query result: { hasToken: true, hasChannel: true, ... }
[capture-viewer] Sending Slack notification...
[capture-viewer] Slack notification result: { success: true }
```

**If you see:**
```
[capture-viewer] Slack not configured - skipping notification
```
→ Check the `hasToken` and `hasChannel` values

## Common Slack API Errors & Fixes

### `not_in_channel`
**Problem:** Bot not invited to the channel

**Fix:**
1. Open Slack
2. Go to your notification channel
3. Type: `/invite @DocBase` (or your bot name)
4. Confirm

### `invalid_auth`
**Problem:** Token is invalid or revoked

**Fix:**
1. Go to Account → Slack Integration
2. Click "Disconnect"
3. Click "Connect to Slack" again
4. Select channel again

### `channel_not_found`
**Problem:** Channel ID is wrong

**Fix:**
1. Go to Account → Slack Integration
2. Select the channel again from the dropdown

### `missing_scope`
**Problem:** Bot missing required permissions

**Fix:**
1. Go to https://api.slack.com/apps
2. Select your app
3. Go to "OAuth & Permissions"
4. Verify bot has these scopes:
   - `chat:write`
   - `channels:read`
   - `groups:read`
5. If not, add them and reinstall the app

## Quick Database Check

Run this in Supabase SQL Editor (replace YOUR_EMAIL):

```sql
SELECT 
  u.email,
  d.slack_access_token IS NOT NULL as has_token,
  d.slack_channel_id IS NOT NULL as has_channel,
  d.slack_channel_id,
  d.slack_channel_name,
  d.slack_team_name,
  LEFT(d.slack_access_token, 10) as token_preview
FROM auth.users u
LEFT JOIN domains d ON d.user_id = u.id
WHERE u.email = 'YOUR_EMAIL';
```

**You need:**
- `has_token`: TRUE
- `has_channel`: TRUE
- `token_preview`: Should start with `xoxb-`

## If Still Not Working

Share with me:
1. Output from `/api/test-slack` endpoint
2. Output from the SQL query above
3. Your server logs after accessing a link
4. Any error messages you see

This will tell us exactly what's wrong!
