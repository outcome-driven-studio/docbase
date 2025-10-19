# Docbase

An open-source alternative to DocSend for securely sharing documents with tracking and analytics.

## ✨ Features

### Document Sharing & Security
- 📄 **Secure PDF Sharing** - Upload and share PDFs with password protection and expiration dates
- 🔐 **Access Control** - Email verification, password protection, and self-hosted signup controls
- 🎨 **Custom Branding** - Add logos, cover letters, and signatures to shared documents
- 📱 **Responsive Viewer** - Beautiful slideshow and document modes that work on all devices

### Signatures & Agreements
- ✍️ **E-Signatures** - Request and collect legally binding signatures on documents
- 📋 **Signature Tracking** - Track signature status and audit trails
- 🖊️ **Multiple Signature Methods** - Draw, upload, or type signatures
- ⚖️ **NDA & Contract Ready** - Perfect for NDAs, contracts, and legal agreements

### Analytics & Tracking
- 📊 **View Analytics** - Track who views your documents, when, and for how long
- 👥 **Contact Management** - Organize contacts with groups
- 📈 **Engagement Insights** - Detailed analytics for each shared link
- 🔔 **Notifications** - Get notified when documents are viewed or signed

### Communication
- ✉️ **Email Integration** - Send documents via email with magic links (powered by Resend)
- 💬 **Slack Integration** - Get notifications in Slack when documents are viewed or signed
- 🎯 **Personalized Emails** - Custom email templates with your branding

### Privacy & Control
- 🔒 **Privacy First** - Row-level security and encrypted passwords
- 🏢 **Self-Hosted Ready** - Full control over your data and users
- 🚫 **Disable Signups** - Control who can create accounts on your instance
- 📦 **Open Source** - MIT licensed, transparent, and community-driven

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

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Email**: Resend
- **AI**: OpenAI GPT-4o-mini
- **Monitoring**: Braintrust (optional)
- **Integrations**: Slack, Google Maps

## Required Services

### Core (Required)

- **Supabase** - Database, authentication, and file storage ([Sign up](https://app.supabase.com/))
  - PostgreSQL database with Row Level Security
  - Authentication with magic links and email/password
  - Storage buckets for PDF files

### Optional Features

- **Resend** - Email sending ([Sign up](https://resend.com/))
  - Required for: Document sharing emails, magic link authentication, notifications
  - Free tier: 3,000 emails/month

- **OpenAI** - AI-powered features ([Sign up](https://platform.openai.com/))
  - Required for: Signature block parsing
  - Uses GPT-4o-mini (cost-effective)

- **Google Maps** - Address autocomplete ([Get API key](https://developers.google.com/maps/documentation/javascript/get-api-key))
  - Optional: Enhances contact management with address suggestions

- **Braintrust** - Prompt management and logging ([Sign up](https://braintrust.dev/))
  - Optional: AI prompt versioning and monitoring

- **Slack** - Team notifications ([Setup OAuth](https://api.slack.com/apps))
  - Optional: Get notified in Slack when documents are viewed or signed

## Environment Variables

See `env.example` for a complete list with descriptions. Core variables:

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Self-Hosted Configuration

For self-hosted instances, you can control access:

```bash
# Disable new signups (only allow existing users to sign in)
DISABLE_SIGNUPS="true"
```

This is useful when you want to run Docbase privately and control who has access to your instance.

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

## Use Cases

### For Founders & Fundraising
- 🚀 Share pitch decks with investors and track engagement
- 📊 See which slides investors spend the most time on
- 🔒 Protect sensitive financial information with passwords
- ✍️ Get NDAs signed before sharing confidential materials

### For Sales & Business Development
- 📄 Share proposals and track when prospects view them
- 🎯 Follow up at the right time based on engagement data
- 🖊️ Get contracts and agreements signed electronically
- 📧 Send personalized documents with custom branding

### For Legal & HR
- ⚖️ Send contracts and collect signatures
- 🔐 Secure sharing of sensitive documents
- 📋 Track document access and maintain audit trails
- ✅ Ensure compliance with signature timestamps

### For Self-Hosted Teams
- 🏢 Run your own private DocSend alternative
- 🚫 Control who can create accounts (disable public signups)
- 💾 Keep all data on your own infrastructure
- 🔧 Customize and extend the platform as needed

## Why Docbase?

### vs. DocSend
- ✅ **Free & Open Source** - No per-document pricing
- ✅ **Self-Hosted** - Full control over your data
- ✅ **E-Signatures Built-In** - No need for separate DocuSign/HelloSign
- ✅ **Customizable** - Extend and modify as needed
- ✅ **Modern Stack** - Built with Next.js 14 and TypeScript

### vs. Building Your Own
- ✅ **Production Ready** - Battle-tested features and security
- ✅ **Full Feature Set** - Signatures, analytics, notifications, and more
- ✅ **Active Development** - Regular updates and improvements
- ✅ **Great DX** - Clean code, TypeScript, comprehensive docs

## Contributing

We love contributions! Whether it's bug fixes, new features, or documentation improvements, all contributions are welcome.

### How to Contribute

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** - see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
3. **Test your changes** - ensure the build passes (`npm run build`)
4. **Submit a pull request** with a clear description of your changes

### Development Guidelines

- Use TypeScript for type safety
- Follow existing code style and patterns
- Write meaningful commit messages
- Keep PRs focused and small when possible
- Update documentation as needed

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## Community & Support

- 📖 **Documentation** - [GitHub Repository](https://github.com/alanagoyal/docbase)
- 🐛 **Bug Reports** - [Open an Issue](https://github.com/alanagoyal/docbase/issues)
- 💡 **Feature Requests** - [Start a Discussion](https://github.com/alanagoyal/docbase/discussions)
- 💬 **Questions** - [GitHub Discussions](https://github.com/alanagoyal/docbase/discussions)

## Roadmap

- [ ] Multi-document packages
- [ ] Advanced analytics (heatmaps, time-based insights)
- [ ] Mobile apps (React Native)
- [ ] Video support
- [ ] Custom domains for shared links
- [ ] Webhook support for integrations
- [ ] API for programmatic access

## Star History

If you find Docbase useful, please consider giving it a star! ⭐

## License

Licensed under the [MIT license](https://github.com/alanagoyal/docbase/blob/main/LICENSE.md).

---

**Built with ❤️ by the open source community**
