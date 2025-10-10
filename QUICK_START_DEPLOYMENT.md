# Quick Start: Deploy to docs.vibetm.ai

## TL;DR - What You Need to Do

### 1. Set Up Resend (10 minutes)

**Get API Key:**

1. Go to https://resend.com/signup
2. Create account → Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)

**Add Domain:**

1. In Resend: Domains → Add Domain → Enter `docs.vibetm.ai`
2. Resend shows you DNS records
3. Add these to your DNS:
   - 1 TXT record (SPF)
   - 3 CNAME records (DKIM)
   - 1 TXT record (DMARC - optional)
4. Wait 10 minutes → Click "Verify" in Resend

### 2. Deploy to Vercel (15 minutes)

**Push to GitHub:**

```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

**Deploy:**

1. Go to https://vercel.com/new
2. Import your repo
3. Add environment variables:
   ```
   NEXT_PUBLIC_SITE_URL=https://docs.vibetm.ai
   NEXT_PUBLIC_SUPABASE_URL=<your-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-key>
   RESEND_API_KEY=<from-step-1>
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-key>
   OPENAI_API_KEY=<your-key>
   BRAINTRUST_API_KEY=<your-key>
   ```
4. Click Deploy

**Add Custom Domain:**

1. Project Settings → Domains → Add `docs.vibetm.ai`
2. Add DNS record: CNAME `docs` → `cname.vercel-dns.com`

### 3. Configure Supabase (5 minutes)

1. Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL: `https://docs.vibetm.ai`
3. Add Redirect URLs:
   - `https://docs.vibetm.ai/auth/confirm`
   - `https://docs.vibetm.ai/**`

### 4. Test! (5 minutes)

1. Visit https://docs.vibetm.ai
2. Sign up → Confirm email → Create link → Share link
3. Done! 🎉

## DNS Records You'll Need

### Vercel (for website)

```
CNAME: docs → cname.vercel-dns.com
```

### Resend (for emails)

```
TXT (SPF):   docs.vibetm.ai → v=spf1 include:amazonses.com ~all
CNAME (DKIM): resend._domainkey.docs.vibetm.ai → [from Resend]
CNAME (DKIM): resend2._domainkey.docs.vibetm.ai → [from Resend]
CNAME (DKIM): resend3._domainkey.docs.vibetm.ai → [from Resend]
```

## What's Already Done ✅

- Authentication flow fixed
- Database migrations ready
- All RPC functions created
- Email templates updated
- Storage bucket configured
- Error handling improved
- TypeScript types fixed
- Documentation complete

## Troubleshooting

**"Email link invalid"** → Already fixed ✅
**"Link not found"** → Already fixed ✅
**"Failed to send email"** → Verify Resend domain
**"Database table not found"** → Already fixed ✅

Everything is ready to deploy! 🚀

For detailed instructions, see:

- **DEPLOYMENT_GUIDE.md** - Comprehensive step-by-step guide
- **DEPLOYMENT_CHECKLIST.md** - Interactive checklist
- **AUTH_SETUP.md** - Authentication system documentation
- **CHANGES_SUMMARY.md** - What was fixed and why
