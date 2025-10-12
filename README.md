# Docbase

An open-source alternative to DocSend for securely sharing documents with tracking and analytics.

## Features

- 📄 **Secure Document Sharing** - Upload and share PDFs with password protection
- 📊 **View Analytics** - Track who views your documents and when
- 🔗 **Custom Links** - Create shareable links with optional expiration dates
- ✉️ **Email Integration** - Send documents via email with magic links
- 🎨 **Professional Signatures** - Add signature blocks to your emails
- 🏢 **Custom Domains** - Use your own domain for email sending
- 👥 **Contact Management** - Organize contacts with groups
- 🔐 **Privacy First** - Row-level security and encrypted passwords

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/alanagoyal/docbase
cd docbase
```

### 2. Run the Setup Wizard

We've created an interactive setup wizard to make configuration easy:

```bash
npm run setup
```

The wizard will:

- ✅ Guide you through all required environment variables
- ✅ Provide links to get API keys
- ✅ Validate your inputs
- ✅ Create your `.env` file automatically
- ✅ Show you next steps

**Or manually create `.env`:**

If you prefer to configure manually, copy `env.example` to `.env` and fill in your values.

### 3. Install Dependencies

```bash
npm install
```

### 4. Set up Supabase Database

1. Create a [Supabase](https://app.supabase.com/) project
2. Link to your project and push migrations:

```bash
npx supabase login
npx supabase link
npx supabase db push
```

3. Create storage bucket:
   - Go to Supabase Dashboard > Storage
   - Create a new public bucket named `cube`

### 5. Start Development Server

```bash
npm run dev
```

Your app will be running at **http://localhost:3000**

## Required Services

### Core (Required)

- **Supabase** - Database and authentication ([Sign up](https://app.supabase.com/))

### Optional Features

- **Resend** - Email sending ([Sign up](https://resend.com/)) - Required for document sharing emails
- **OpenAI** - Signature block parsing ([Sign up](https://platform.openai.com/)) - Required for AI features
- **Google Maps** - Address autocomplete ([Get API key](https://developers.google.com/maps/documentation/javascript/get-api-key))
- **Braintrust** - Prompt management ([Sign up](https://braintrust.dev/))

## Environment Variables

See `env.example` for a complete list with descriptions. Core variables:

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
```

## Deployment

Deploy using [Vercel](https://vercel.com):

1. Push code to GitHub
2. Import repository to Vercel
3. Add all environment variables from your `.env` file
4. Deploy!

For detailed deployment instructions with custom domains and email setup, see:

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete walkthrough
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist

## Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Email**: Resend
- **AI**: OpenAI GPT-4o-mini for document summarization and signature parsing
- **Monitoring**: Braintrust for prompt management and logging

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

- 📖 [Documentation](https://github.com/alanagoyal/docbase)
- 🐛 [Issues](https://github.com/alanagoyal/docbase/issues)
- 💬 [Discussions](https://github.com/alanagoyal/docbase/discussions)

## License

Licensed under the [MIT license](https://github.com/alanagoyal/docbase/blob/main/LICENSE.md).
