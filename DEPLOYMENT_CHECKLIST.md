# Deployment Checklist - docs.vibetm.ai

Use this checklist to deploy step-by-step.

## Phase 1: Code Preparation ✅ (DONE)

- [x] Fix authentication flow
- [x] Update middleware to use @supabase/ssr
- [x] Create database migrations
- [x] Add RPC functions
- [x] Update email addresses to docs.vibetm.ai
- [x] Fix link creation and viewing
- [x] Handle null account states
- [x] Add proper error handling

## Phase 2: GitHub & Vercel

### Push to GitHub

```bash
cd /Users/anirudhmadhavan/repos/docbase
git status
git add .
git commit -m "Fix authentication, database setup, and prepare for production deployment"
git push origin main
```

### Deploy to Vercel

- [ ] Go to https://vercel.com/new
- [ ] Import GitHub repository
- [ ] Set environment variables (see DEPLOYMENT_GUIDE.md)
- [ ] Deploy

## Phase 3: DNS Configuration

### A. Add Vercel Domain (for docs.vibetm.ai web access)

In your DNS provider for vibetm.ai:

- [ ] Add CNAME: `docs` → `cname.vercel-dns.com`
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Verify SSL certificate in Vercel

### B. Add Resend Domain (for email sending from docs.vibetm.ai)

In your DNS provider for vibetm.ai:

- [ ] Add SPF TXT record
- [ ] Add 3 DKIM CNAME records (get values from Resend)
- [ ] Add DMARC TXT record (optional)
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Verify domain in Resend dashboard

## Phase 4: Supabase Configuration

- [ ] Go to Supabase → Authentication → URL Configuration
- [ ] Set Site URL: `https://docs.vibetm.ai`
- [ ] Add Redirect URLs:
  - `https://docs.vibetm.ai/auth/confirm`
  - `https://docs.vibetm.ai/account`
  - `https://docs.vibetm.ai/**`
- [ ] Verify storage bucket `cube` exists
- [ ] Add storage policies (see DEPLOYMENT_GUIDE.md)

## Phase 5: Testing

### Basic Tests

- [ ] Visit https://docs.vibetm.ai
- [ ] Sign up with new account
- [ ] Confirm email (check inbox)
- [ ] Log in to account
- [ ] Upload a document
- [ ] Create a link
- [ ] View link (authenticated)
- [ ] View link (incognito - test magic link email)

### Advanced Tests

- [ ] Test password-protected links
- [ ] Test link expiration
- [ ] Test analytics tracking
- [ ] Test contact management
- [ ] Test document management

## Phase 6: Monitoring

### Set Up Monitoring

- [ ] Check Vercel deployment logs
- [ ] Check Supabase logs for errors
- [ ] Check Resend dashboard for email deliverability
- [ ] Set up error alerting (optional)

## Environment Variables Required

Copy these to Vercel:

```env
NEXT_PUBLIC_SITE_URL=https://docs.vibetm.ai
NEXT_PUBLIC_SUPABASE_URL=<from-supabase-dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
RESEND_API_KEY=<from-resend-dashboard>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from-google-cloud>
OPENAI_API_KEY=<from-openai>
BRAINTRUST_API_KEY=<from-braintrust>
```

## Quick Reference: Where to Get Keys

| Service               | Where to Get Key                       | Dashboard URL                        |
| --------------------- | -------------------------------------- | ------------------------------------ |
| Supabase URL          | Project Settings → API → Project URL   | https://app.supabase.com             |
| Supabase Anon Key     | Project Settings → API → anon public   | https://app.supabase.com             |
| Supabase Service Role | Project Settings → API → service_role  | https://app.supabase.com             |
| Resend API Key        | API Keys → Create API Key              | https://resend.com/api-keys          |
| Google Maps           | Google Cloud Console → APIs & Services | https://console.cloud.google.com     |
| OpenAI                | API Keys                               | https://platform.openai.com/api-keys |
| Braintrust            | Settings → API Keys                    | https://braintrust.dev               |

## Estimated Timeline

- Code push: 5 minutes
- Vercel deployment: 5-10 minutes
- DNS propagation: 10-60 minutes
- Resend domain verification: 10-30 minutes
- Testing: 15-30 minutes

**Total: 45 minutes - 2 hours**

## Support

If you encounter issues:

1. Check logs in Vercel dashboard
2. Check Supabase logs
3. Verify DNS records: https://mxtoolbox.com/
4. Check Resend domain verification status
5. Review error messages in browser console

The application is production-ready! 🚀
