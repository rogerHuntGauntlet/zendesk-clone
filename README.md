# AutoCRM - AI-Enhanced Customer Support Platform

An intelligent customer relationship management system built with Next.js, Supabase, and AI capabilities.

## Features

- 🎫 Comprehensive ticket management
- 🤖 AI-powered response generation
- 📚 RAG-based knowledge management
- 🔄 Automated ticket routing
- 👥 Team collaboration tools
- 📱 Multi-channel support
- 🔍 Advanced analytics

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI Integration**: LangChain
- **Deployment**: AWS Amplify
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for local Supabase)
- Git

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/rogerHuntGauntlet/zendesk-clone.git
   cd zendesk-clone
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. Start Supabase locally:
   ```bash
   supabase start
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
├── frontend/          # Next.js application
├── supabase/         # Database migrations and config
├── 1_support_docs/   # Project documentation
└── amplify.yml       # AWS Amplify configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and confidential.

## Acknowledgments

- Built as part of the Gauntlet AI Project series
- Inspired by modern CRM systems like Zendesk 