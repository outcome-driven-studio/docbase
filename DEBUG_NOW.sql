-- IMMEDIATE DEBUG - Run this now and share the results
-- Replace YOUR_EMAIL with your actual email address

-- 1. Do you have Slack configured?
SELECT 
  'SLACK CONFIG' as check_type,
  u.email,
  d.slack_access_token IS NOT NULL as has_token,
  d.slack_channel_id IS NOT NULL as has_channel,
  d.slack_channel_id,
  d.slack_channel_name,
  d.slack_team_name,
  CASE 
    WHEN d.slack_access_token IS NULL THEN '❌ NO TOKEN - Need to connect Slack'
    WHEN d.slack_channel_id IS NULL THEN '❌ NO CHANNEL - Need to select channel'
    ELSE '✅ CONFIGURED'
  END as status
FROM auth.users u
LEFT JOIN domains d ON d.user_id = u.id
WHERE u.email = 'YOUR_EMAIL';

-- 2. Have any viewers been captured recently?
SELECT 
  'RECENT VIEWERS' as check_type,
  v.viewed_at,
  v.email as viewer_email,
  l.name as document_name,
  l.created_by as owner_id
FROM viewers v
JOIN links l ON l.id = v.link_id
WHERE l.created_by = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL')
ORDER BY v.viewed_at DESC
LIMIT 5;

-- 3. Show me EVERYTHING about your domain
SELECT 
  'FULL DOMAIN INFO' as check_type,
  *
FROM domains
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
