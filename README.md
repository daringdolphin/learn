# Chemistry Mock Exam Feedback System

An AI-powered feedback system for Secondary 4 Chemistry mock exams that helps students improve their performance by providing detailed analysis of their answers.

## Features

- **Question Bank**: Browse through a collection of Chemistry exam questions with images
- **AI-Powered Analysis**: Upload photos of your written answers and get detailed feedback using advanced AI models
- **Comprehensive Feedback**: Receive analysis covering:
  - Conceptual understanding
  - Exam skills and technique
  - Mark allocation breakdown
  - Improvement suggestions
- **Mobile-Friendly**: Responsive design that works on all devices
- **Camera Integration**: Capture answers directly using your device's camera
- **Progressive Web App**: Install as an app on your device

## Tech Stack

- **IDE**: [Cursor](https://www.cursor.com/)
- **AI Tools**: [V0](https://v0.dev/), [Perplexity](https://www.perplexity.com/)
- **Frontend**: [Next.js](https://nextjs.org/docs), [Tailwind CSS](https://tailwindcss.com/docs/guides/nextjs), [Shadcn/ui](https://ui.shadcn.com/docs/installation), [Framer Motion](https://www.framer.com/motion/introduction/)
- **Backend**: [PostgreSQL](https://www.postgresql.org/about/), [Supabase](https://supabase.com/), [Drizzle ORM](https://orm.drizzle.team/docs/get-started-postgresql), [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- **AI Models**: [Anthropic Claude](https://docs.anthropic.com/), [OpenAI GPT](https://platform.openai.com/docs)
- **Deployment**: [Vercel](https://vercel.com/)

## Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- Supabase account
- Anthropic API key
- OpenAI API key (optional)

## Setup

### 1. Clone the repository
```powershell
git clone <repository-url>
cd feedback
```

### 2. Install dependencies
```powershell
pnpm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_supabase_postgres_connection_string

# AI Models
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key (optional)

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup
```powershell
# Generate database migrations
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Seed the database with sample questions
pnpm run dev
# Then visit http://localhost:3000/seed to seed the database
```

### 5. Run the application
```powershell
pnpm run dev
```

The app will be available at `http://localhost:3000`

## Usage

### For Students

1. **Browse Questions**: View available Chemistry exam questions on the homepage
2. **Select a Question**: Click on any question to view the full prompt and requirements
3. **Upload Your Answer**: 
   - Take a photo of your written answer using the camera
   - Or upload an existing image file
4. **Get Feedback**: Submit your answer to receive detailed AI-powered feedback
5. **Review Results**: Analyze the feedback to understand areas for improvement

### For Educators

1. **Add Questions**: Use the seed functionality to add new questions to the database
2. **Monitor Usage**: Track student engagement and common areas of difficulty
3. **Customize Feedback**: Modify the AI prompts to adjust feedback style and focus

## Project Structure

```
feedback/
├── actions/           # Server actions for database operations
├── app/              # Next.js app router pages and components
├── components/       # Reusable UI components
├── db/              # Database schema and configuration
├── lib/             # Utility functions and API integrations
├── prompts/         # AI prompts for feedback generation
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## Available Scripts

```powershell
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run lint         # Run ESLint
pnpm run clean        # Format and fix code
pnpm run db:generate  # Generate database migrations
pnpm run db:migrate   # Apply database migrations
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is private and proprietary.
