#!/usr/bin/env node

const readline = require("readline")
const fs = require("fs")
const path = require("path")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const envConfig = {}

console.log("\n🚀 Welcome to Docbase Setup!\n")
console.log("This wizard will help you configure your environment variables.\n")
console.log("Press Ctrl+C at any time to exit.\n")

const questions = [
  {
    key: "NEXT_PUBLIC_SITE_URL",
    question:
      "Enter your site URL (e.g., http://localhost:3000 for local, https://yourdomain.com for production): ",
    validate: (value) => {
      if (!value) return "Site URL is required"
      if (!value.startsWith("http://") && !value.startsWith("https://")) {
        return "Site URL must start with http:// or https://"
      }
      return true
    },
    help: "This is the URL where your application will be accessed. Use http://localhost:3000 for local development.",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    question:
      "Enter your Supabase project URL (from Supabase Dashboard > Project Settings > API): ",
    validate: (value) => {
      if (!value) return "Supabase URL is required"
      if (!value.includes("supabase.co")) {
        return "Should be a Supabase URL (e.g., https://xxx.supabase.co)"
      }
      return true
    },
    help: "Get this from: https://app.supabase.com > Your Project > Settings > API > Project URL",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    question: "Enter your Supabase anon/public key: ",
    validate: (value) => (value ? true : "Supabase anon key is required"),
    help: "Get this from: https://app.supabase.com > Your Project > Settings > API > Project API keys > anon public",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    question: "Enter your Supabase service role key: ",
    validate: (value) =>
      value ? true : "Supabase service role key is required",
    help: "Get this from: https://app.supabase.com > Your Project > Settings > API > Project API keys > service_role (Keep this secret!)",
  },
  {
    key: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    question:
      "Enter your Google Maps API key (optional, press Enter to skip): ",
    validate: () => true,
    optional: true,
    help: "Get this from: https://developers.google.com/maps/documentation/javascript/get-api-key",
  },
  {
    key: "RESEND_API_KEY",
    question: "Enter your Resend API key (optional, press Enter to skip): ",
    validate: () => true,
    optional: true,
    help: "Get this from: https://resend.com/api-keys (Required for sending emails)",
  },
  {
    key: "OPENAI_API_KEY",
    question: "Enter your OpenAI API key (optional, press Enter to skip): ",
    validate: () => true,
    optional: true,
    help: "Get this from: https://platform.openai.com/api-keys (Required for signature block parsing)",
  },
  {
    key: "BRAINTRUST_API_KEY",
    question: "Enter your Braintrust API key (optional, press Enter to skip): ",
    validate: () => true,
    optional: true,
    help: "Get this from: https://braintrust.dev (Required for prompt management and logging)",
  },
]

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile()
    return
  }

  const q = questions[index]

  console.log(`\n📝 ${q.key}`)
  console.log(`💡 ${q.help}`)

  rl.question(`${q.question}`, (answer) => {
    const trimmedAnswer = answer.trim()

    // Allow empty for optional fields
    if (!trimmedAnswer && q.optional) {
      console.log(`⏭️  Skipped (optional)`)
      askQuestion(index + 1)
      return
    }

    const validation = q.validate(trimmedAnswer)
    if (validation !== true) {
      console.log(`❌ ${validation}`)
      askQuestion(index) // Ask again
      return
    }

    envConfig[q.key] = trimmedAnswer
    console.log("✅ Saved")
    askQuestion(index + 1)
  })
}

function createEnvFile() {
  console.log("\n📄 Creating .env file...\n")

  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}="${value}"`)
    .join("\n")

  const envPath = path.join(process.cwd(), ".env")

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    rl.question(
      "\n⚠️  .env file already exists. Overwrite? (y/N): ",
      (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          writeEnvFile(envPath, envContent)
        } else {
          console.log(
            "\n❌ Setup cancelled. Your existing .env file was not modified.\n"
          )
          rl.close()
        }
      }
    )
  } else {
    writeEnvFile(envPath, envContent)
  }
}

function writeEnvFile(envPath, content) {
  fs.writeFileSync(envPath, content)

  console.log("✅ .env file created successfully!\n")
  console.log("📋 Your configuration:\n")
  console.log(content)
  console.log("\n")

  showNextSteps()
  rl.close()
}

function showNextSteps() {
  console.log("🎉 Setup Complete!\n")
  console.log("📌 Next Steps:\n")
  console.log("1. Install dependencies:")
  console.log("   npm install\n")
  console.log("2. Set up Supabase database:")
  console.log("   npx supabase login")
  console.log("   npx supabase link")
  console.log("   npx supabase db push\n")
  console.log("3. Create storage bucket in Supabase Dashboard:")
  console.log("   - Go to Storage > Create bucket")
  console.log('   - Name: "cube"')
  console.log("   - Make it public\n")
  console.log("4. (Optional) Set up Braintrust prompts:")
  console.log("   npx braintrust push braintrust/docbase.ts\n")
  console.log("5. Start the development server:")
  console.log("   npm run dev\n")
  console.log("6. Open http://localhost:3000 in your browser\n")
  console.log("📚 For more details, see README.md\n")
}

// Start the wizard
console.log("Let's get started! 🎯\n")
askQuestion(0)
