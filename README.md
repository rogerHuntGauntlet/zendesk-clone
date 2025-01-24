# ZenDesk Clone Project

A modern, AI-powered ticketing system built with Next.js, Supabase, and OpenAI.

## Recent Updates

### Ticket Creation System

1. **AI-Assisted Ticket Creation**
   - Chat interface with AI to describe issues
   - Voice recording with waveform visualization
   - Image attachment support
   - AI processes conversation to suggest ticket structure
   - Manual review and edit before final submission

2. **Manual Mode**
   - Toggle switch for direct ticket creation
   - Simple form interface for title, description, and priority
   - No AI processing required

3. **Database Structure**
   - Main `zen_tickets` table for ticket data
   - Separate `zen_ticket_attachments` table for file attachments
   - Valid priority levels: low, medium, high, urgent

### Ticket Review System

1. **Enhanced Ticket Detail View**
   - Wider modal interface (1200px) for better content display
   - Real-time chat with AI and human agents
   - Web search integration via Tavily API
   - Automatic recommendations from knowledge base
   - Improved message display and scrolling

2. **Message Features**
   - Text chat with markdown support
   - Image and audio attachments
   - Real-time loading states
   - AI response streaming
   - Web resource recommendations

3. **Database Structure**
   - New `zen_ticket_messages` table for conversation history
   - Message types: text, image, audio
   - Metadata for recommendations and knowledge base items
   - Real-time updates via Supabase subscriptions

### Key Features

1. **Multi-Modal Input**
   - Text chat
   - Voice recording with visual feedback
   - Image uploads
   - Real-time transcription

2. **AI Processing**
   - Analyzes conversation context
   - Suggests appropriate titles
   - Recommends priority levels
   - Structures description content

3. **User Interface**
   - Modern, responsive design
   - Real-time chat with typing indicators
   - Waveform visualization for audio
   - Preview and edit capabilities

4. **Data Management**
   - Separate attachment handling
   - Activity logging
   - Project association
   - User tracking (client and creator)

## Technical Details

### Dependencies
- Next.js 13+ (App Router)
- Supabase
- OpenAI GPT-4
- WaveSurfer.js (audio visualization)
- Shadcn UI components
- React Markdown
- Lucide React Icons

### Database Schema

#### zen_tickets
- title: string
- description: text
- priority: enum (low, medium, high, urgent)
- status: string
- project_id: uuid
- client: uuid
- created_by: uuid
- category: jsonb

#### zen_ticket_attachments
- ticket_id: uuid
- name: string
- url: string
- type: string
- size: number
- uploaded_by: uuid

#### zen_ticket_messages
- id: uuid
- ticket_id: uuid
- content: text
- source: enum (client, agent, ai)
- created_at: timestamp
- created_by: uuid
- has_been_read: boolean
- metadata: jsonb (recommendations, knowledge_base)
- type: enum (text, image, audio)
- mediaUrl: string

## Usage

1. **Creating a Ticket (AI-Assisted)**
   ```
   1. Click "New Ticket"
   2. Describe your issue via:
      - Text chat
      - Voice recording
      - Image uploads
   3. Click "Process with AI"
   4. Review and edit suggestions
   5. Click "Create Ticket"
   ```

2. **Creating a Ticket (Manual)**
   ```
   1. Click "New Ticket"
   2. Toggle "Manual Entry Mode"
   3. Fill out the form
   4. Click "Create Ticket"
   ```

## Recent Fixes

1. **JSON Parsing**
   - Improved AI response formatting
   - Better error handling
   - Cleaner JSON structure

2. **UI Improvements**
   - Added DialogDescription for accessibility
   - Restored manual mode toggle
   - Fixed form visibility issues

3. **Data Flow**
   - Separated attachment handling
   - Improved error messaging
   - Added activity logging

## Getting Started

### Environment Setup

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
```

### Development Server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a custom font for Vercel.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - Backend and database
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference) - AI integration
- [WaveSurfer.js](https://wavesurfer-js.org/) - Audio visualization
- [Shadcn UI](https://ui.shadcn.com/) - UI components

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
