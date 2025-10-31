-- Debug why Slack notifications aren't being sent
-- Run this with YOUR email address

-- Step 1: Check if you have Slack configured correctly
SELECT 
  u.email,
  u.id as user_id,
  d.slack_access_token IS NOT NULL as has_token,
  d.slack_channel_id IS NOT NULL as has_channel,
  d.slack_channel_id,
  d.slack_channel_name,
  d.slack_team_name,
  LEFT(d.slack_access_token, 10) as token_prefix
FROM auth.users u
LEFT JOIN domains d ON d.user_id = u.id
WHERE u.email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Expected: has_token = true, has_channel = true (both must be true!)

-- Step 2: Check your recent links (documents you created)
SELECT 
  l.id as link_id,
  l.name,
  l.filename,
  l.created_by,
  l.created_at,
  d.slack_channel_id IS NOT NULL as owner_has_slack_configured
FROM links l
JOIN domains d ON d.user_id = l.created_by
WHERE l.created_by = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
ORDER BY l.created_at DESC
LIMIT 5;

-- Step 3: Check if anyone viewed your links recently
SELECT 
  v.link_id,
  l.name as document_name,
  v.email as viewer_email,
  v.viewed_at,
  l.created_by as document_owner_id,
  d.slack_access_token IS NOT NULL as owner_has_token,
  d.slack_channel_id IS NOT NULL as owner_has_channel,
  d.slack_channel_name as target_channel
FROM viewers v
JOIN links l ON l.id = v.link_id
JOIN domains d ON d.user_id = l.created_by
WHERE l.created_by = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
ORDER BY v.viewed_at DESC
LIMIT 10;

-- This shows if notifications SHOULD have been triggered
-- owner_has_token AND owner_has_channel must both be TRUE
