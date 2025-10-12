# Setup Guide

This guide will help you get Docbase running on your local machine for development.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account ([Sign up free](https://app.supabase.com/))
- Basic terminal/command line knowledge

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/alanagoyal/docbase
cd docbase
npm install
```

### 2. Configure Environment Variables

**Option A: Interactive Setup (Recommended)**

Run the setup wizard which will guide you through configuration:

```bash
npm run setup
```

The wizard will:

- Ask for each required environment variable
- Provide links to get API keys
- Validate your inputs
- Create the `.env` file for you
- Show next steps

**Option B: Manual Setup**

Copy the example file and edit it:

```bash
cp env.example .env
# Then edit .env with your favorite editor
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Click "New Project"
3. Fill in project details and wait for it to initialize
4. Go to Project Settings > API to get your keys

#### Run Database Migrations

```bash
# Login to Supabase CLI
npx supabase login

# Link to your project
npx supabase link

# Push migrations to create tables
npx supabase db push
```

#### Create Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Click "Create new bucket"
3. Name: `cube`
4. Make it **public**
5. Click "Create bucket"

### 4. Set Up Optional Services

#### Resend (for emails)

1. Sign up at [https://resend.com/](https://resend.com/)
2. Get your API key from the dashboard
3. Add it to your `.env` file
4. (For production) Add and verify your custom domain in Resend

#### OpenAI (for AI features)

1. Sign up at [https://platform.openai.com/](https://platform.openai.com/)
2. Create an API key
3. Add it to your `.env` file
4. Note: Signature block parsing and document summarization require this

#### Google Maps (for address autocomplete)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Maps JavaScript API
3. Create credentials (API key)
4. Add it to your `.env` file

#### Braintrust (for prompt management)

1. Sign up at [https://braintrust.dev/](https://braintrust.dev/)
2. Get your API key
3. Add it to your `.env` file
4. Push prompts: `npx braintrust push braintrust/docbase.ts`

### 5. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Verification Checklist

After setup, verify everything works:

- [ ] Homepage loads without errors
- [ ] You can sign up with email
- [ ] Email confirmation link works (check inbox)
- [ ] You can access /account after confirming
- [ ] You can create a new link by uploading a PDF
- [ ] The link appears in /links with view count
- [ ] You can share the link and view it in incognito mode

## Troubleshooting

### "Database setup required" error

You need to run the migrations:

```bash
npx supabase db push
```

### "Storage bucket not found" error

Create the `cube` bucket in Supabase Dashboard > Storage

### Email sending fails

Make sure:

1. RESEND_API_KEY is set in .env
2. For production, your domain is verified in Resend

### Signature block parsing fails

Make sure OPENAI_API_KEY is set in .env. Note: This feature is optional.

## Next Steps

- Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment
- Check out the [Contributing Guidelines](#) to start developing
- Join our community discussions

## Getting Help

- 🐛 [Report a bug](https://github.com/alanagoyal/docbase/issues)
- 💬 [Ask a question](https://github.com/alanagoyal/docbase/discussions)
- 📧 Check Supabase logs for detailed error messages
