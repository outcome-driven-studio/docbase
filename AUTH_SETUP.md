# Authentication Setup Guide

This guide documents the complete authentication flow for Docbase and how to set it up.

## Overview

Docbase uses Supabase for authentication with email confirmation via PKCE flow. The authentication system has been updated to properly handle email confirmations and session management.

## Quick Setup

### 1. Run Database Migrations

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase db push
```

This will create all necessary tables and triggers.

### 2. Configure Environment Variables

Create a `.env` file with:

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
RESEND_API_KEY="your-resend-api-key"
OPENAI_API_KEY="your-openai-api-key"
BRAINTRUST_API_KEY="your-braintrust-api-key"
```

**Important**: `NEXT_PUBLIC_SITE_URL` must include the protocol (`http://` or `https://`)

### 3. Start the Application

```bash
npm run dev
```

## How Authentication Works

### Email Confirmation Flow

1. **User Signs Up** (`/app/signup/actions.ts`)

   - User submits email and password
   - `supabase.auth.signUp()` is called with `emailRedirectTo: /account`
   - Supabase sends confirmation email with link containing a code

2. **Email Link Clicked**

   - Link goes to `/account?code=...` (Supabase's default behavior)
   - `/app/account/page.tsx` detects the `code` parameter
   - Automatically redirects to `/auth/confirm?code=...&next=/account`

3. **Code Exchange** (`/app/auth/confirm/route.ts`)

   - Receives the `code` parameter
   - Calls `supabase.auth.exchangeCodeForSession(code)` (PKCE flow)
   - OR calls `supabase.auth.verifyOtp()` (for magic links)
   - Session is established and stored in cookies
   - Redirects to the `next` parameter (e.g., `/account`)

4. **User Accesses Protected Route**
   - User now has a valid session
   - Middleware refreshes session on each request
   - Database trigger automatically creates user record in `public.users` table

### Key Components

- **`/app/auth/confirm/route.ts`**: Handles both PKCE and OTP authentication flows
- **`/app/account/page.tsx`**: Smart redirect for confirmation codes
- **`/middleware.ts`**: Session management using `@supabase/ssr`
- **Database Trigger**: `handle_new_user()` automatically creates user records

### Supported Authentication Methods

1. **Email + Password with Confirmation** (PKCE flow)

   - Uses `code` parameter
   - Method: `exchangeCodeForSession()`

2. **Magic Links** (OTP flow)
   - Uses `token_hash` and `type` parameters
   - Method: `verifyOtp()`

## Database Schema

The migration creates the following tables:

- `users` - User profiles linked to auth.users
- `contacts` - Contact management
- `links` - Document links
- `viewers` - Link view tracking
- `messages` - Email messages
- `groups` - Contact groups
- `domains` - Custom email domains
- `funds` - Investment funds
- `companies` - Company information
- `investments` - Investment tracking

All tables have Row Level Security (RLS) policies that ensure users can only access their own data.

## Troubleshooting

### Email Link Shows "Invalid or Expired"

This was fixed by:

1. Properly handling the `code` parameter redirect chain
2. Using the correct Supabase client from `@supabase/ssr`
3. Ensuring `NEXT_PUBLIC_SITE_URL` has the protocol prefix

### User Account Not Found

The database trigger `handle_new_user()` automatically creates a user record when someone signs up. If this doesn't happen:

1. Check that the trigger exists in your database
2. Verify RLS policies allow the insert
3. Check Supabase logs for any errors

### Session Not Persisting

Make sure:

1. Middleware is properly configured with `@supabase/ssr`
2. Cookies are being set correctly (check browser DevTools)
3. `NEXT_PUBLIC_SITE_URL` matches your actual URL

## Development Notes

### Why the Smart Redirect?

Supabase's default behavior sends users directly to the `emailRedirectTo` URL with a `code` parameter. We intercept this at `/account` and redirect to `/auth/confirm` to properly exchange the code for a session before allowing access to the protected route.

This approach:

- Works with Supabase's default email templates (no customization needed)
- Handles both PKCE and OTP flows
- Provides better error handling
- Is more maintainable for open-source contributions

### Migration Strategy

The final migration (`20241220000000_reset_and_create_schema.sql`) is designed to:

- Drop and recreate all tables cleanly
- Handle foreign key dependencies in the correct order
- Be idempotent (safe to run multiple times)
- Work consistently across development and production

## Contributing

When contributing authentication-related changes:

1. Test the complete signup → email confirmation → account access flow
2. Verify both email/password and magic link flows work
3. Check that RLS policies correctly restrict data access
4. Update this documentation if the flow changes
