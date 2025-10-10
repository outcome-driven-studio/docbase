# Deployment Guide - docs.vibetm.ai

This guide will walk you through deploying Docbase to `docs.vibetm.ai` using Vercel and setting up email sending via Resend.

## Prerequisites Checklist

- [ ] Vercel account (https://vercel.com)
- [ ] Resend account (https://resend.com)
- [ ] Supabase project (already set up)
- [ ] Access to DNS settings for vibetm.ai domain

## Part 1: Deploy to Vercel

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Fix authentication flow and database setup"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Set Environment Variables in Vercel

Go to **Project Settings** → **Environment Variables** and add:

```bash
NEXT_PUBLIC_SITE_URL=https://docs.vibetm.ai
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
RESEND_API_KEY=<your-resend-api-key>
OPENAI_API_KEY=<your-openai-api-key>
BRAINTRUST_API_KEY=<your-braintrust-api-key>
```

### Step 4: Configure Custom Domain

1. In Vercel, go to **Project Settings** → **Domains**
2. Add domain: `docs.vibetm.ai`
3. Vercel will show you DNS records to add

### Step 5: Add DNS Records for Deployment

In your DNS provider for `vibetm.ai`, add:

**For Vercel deployment:**

```
Type: CNAME
Name: docs
Value: cname.vercel-dns.com
```

Wait for DNS propagation (can take a few minutes to a few hours).

## Part 2: Set Up Resend for Email Sending

### Step 1: Create Resend Account

1. Go to https://resend.com/signup
2. Sign up with your email
3. Verify your email address

### Step 2: Get API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: "Docbase Production"
4. Copy the API key (starts with `re_`)
5. Add it to Vercel environment variables (already done in Part 1, Step 3)

### Step 3: Add Domain to Resend

1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter: `docs.vibetm.ai`
4. Click **Add**

Resend will show you DNS records to configure.

### Step 4: Configure DNS for Email Sending

Add these DNS records to your `vibetm.ai` domain:

#### SPF Record (TXT)

```
Type: TXT
Name: docs.vibetm.ai (or just "docs" depending on your DNS provider)
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### DKIM Records (CNAME) - Resend will provide exact values

You'll get 3 DKIM records like this:

```
Type: CNAME
Name: resend._domainkey.docs.vibetm.ai
Value: [value from Resend - looks like: resend1.amazonses.com]
TTL: 3600

Type: CNAME
Name: resend2._domainkey.docs.vibetm.ai
Value: [value from Resend]
TTL: 3600

Type: CNAME
Name: resend3._domainkey.docs.vibetm.ai
Value: [value from Resend]
TTL: 3600
```

#### DMARC Record (TXT) - Optional but recommended

```
Type: TXT
Name: _dmarc.docs.vibetm.ai
Value: v=DMARC1; p=none; rua=mailto:your-email@vibetm.ai
TTL: 3600
```

### Step 5: Verify Domain in Resend

1. After adding DNS records, wait 5-10 minutes
2. In Resend dashboard, click **Verify** next to your domain
3. Status should change to "Verified" ✅

If verification fails:

- Check DNS records are correct
- Wait longer (DNS can take up to 48 hours, but usually 10-30 minutes)
- Use a DNS checker tool: https://mxtoolbox.com/

## Part 3: Configure Supabase for Production

### Step 1: Update Supabase Redirect URLs

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add these redirect URLs:
   ```
   https://docs.vibetm.ai/auth/confirm
   https://docs.vibetm.ai/account
   https://docs.vibetm.ai/**
   ```

### Step 2: Update Supabase Site URL

Still in **URL Configuration**:

- Set **Site URL** to: `https://docs.vibetm.ai`

### Step 3: Verify Storage Bucket

1. Go to **Storage** → **Policies**
2. Make sure your `cube` bucket has these policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cube');

-- Allow users to read files
CREATE POLICY "Users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'cube');

-- Allow users to update files
CREATE POLICY "Users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cube');

-- Allow users to delete files
CREATE POLICY "Users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cube');
```

## Part 4: Deploy!

### Automatic Deployment

Once you push to GitHub, Vercel will automatically:

1. Build your application
2. Deploy to your custom domain
3. Your app will be live at https://docs.vibetm.ai

### Manual Redeploy

If needed, you can manually redeploy:

1. Go to Vercel dashboard → Your project
2. Click **Deployments**
3. Click **Redeploy** on the latest deployment

## Part 5: Post-Deployment Testing

### Test Checklist

1. **Visit** https://docs.vibetm.ai
2. **Sign up** with a test email
3. **Check email** for confirmation link
4. **Click confirmation** - should authenticate and redirect to account
5. **Create a link** with a test document
6. **View link** in incognito mode
7. **Test magic link** email (for unauthenticated users)
8. **Verify** all features work

### Common Issues and Solutions

**Issue: "Email link is invalid or has expired"**

- ✅ Already fixed in the code
- Verify redirect URLs in Supabase match production domain

**Issue: "Failed to send email"**

- Check Resend domain is verified
- Verify DNS records are correct
- Check API key is set in Vercel environment variables

**Issue: "Database table not found"**

- Already fixed - migrations were run
- If needed, run: `npx supabase db push`

**Issue: Links not appearing**

- Already fixed - RPC functions created
- Verify user record exists in `public.users` table

## Part 6: Update Code for Production Domain

The code has been updated to use:

- Email from: `Docbase <noreply@docs.vibetm.ai>`
- Site URL: `https://docs.vibetm.ai` (via environment variable)

## Monitoring

### Vercel Logs

- Go to Vercel Dashboard → Your Project → **Logs**
- Check for any runtime errors

### Supabase Logs

- Go to Supabase Dashboard → **Logs**
- Monitor authentication and database queries
- Check for RLS policy violations

### Resend Analytics

- Go to Resend Dashboard → **Emails**
- See delivery status, opens, clicks
- Monitor bounces and spam reports

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Custom domain `docs.vibetm.ai` configured and SSL active
- [ ] Resend domain verified
- [ ] Test complete signup → confirmation → account flow
- [ ] Test link creation and viewing
- [ ] Test magic link emails
- [ ] Storage bucket policies configured
- [ ] Monitor logs for errors

## Costs

- **Vercel**: Free for hobby projects (generous limits)
- **Supabase**: Free tier (500MB database, 1GB file storage, 50k MAU)
- **Resend**: Free tier (3,000 emails/month, 100 emails/day)
- **Domain**: Already owned (vibetm.ai)

All services have free tiers that should be sufficient for initial testing and moderate usage.

## DNS Records Summary

You'll need to add these DNS records:

### For Vercel (Web Deployment)

```
Type: CNAME, Name: docs, Value: cname.vercel-dns.com
```

### For Resend (Email Sending)

```
Type: TXT,   Name: docs.vibetm.ai,                    Value: v=spf1 include:amazonses.com ~all
Type: CNAME, Name: resend._domainkey.docs.vibetm.ai,  Value: [from Resend]
Type: CNAME, Name: resend2._domainkey.docs.vibetm.ai, Value: [from Resend]
Type: CNAME, Name: resend3._domainkey.docs.vibetm.ai, Value: [from Resend]
Type: TXT,   Name: _dmarc.docs.vibetm.ai,             Value: v=DMARC1; p=none
```

## Next Steps

1. Start with Part 1 (Vercel deployment)
2. Get the Vercel deployment working
3. Then set up Resend (Part 2)
4. Test everything end-to-end

Your application is production-ready! All the code fixes are in place. 🚀
