<div align="center">

# Mentor‑AI
Hackathon project by Ali Ahmed

</div>

Mentor‑AI is a unified study assistant that helps you learn faster:

- Upload documents (PDF, PPTX, DOCX, TXT, Images with OCR) and chat with AI about them
- Auto‑generate slide decks and present them in the browser
- Create quizzes from your own materials (now supports PDF/PPTX extraction)
- Keep notes/exports of conversations and outlines
- Handy extras: flashcards, calendar, pomodoro

This repository is solely authored for a hackathon submission by Ali Ahmed.

## Features

- Chatbot with document context (OCR included) and Markdown responses
- Save one reply or the whole conversation as a document
- Presentation generator with themeable slides and export
- Quiz generator from topic or uploaded PDF/PPTX/DOCX/TXT
- Clean, dark/light theme consistent across the app

## Tech Stack

- Framework: Next.js 15 (App Router), React 19, TypeScript
- UI: Tailwind CSS, Radix UI, Framer Motion
- State/Data: Zustand, TanStack Query, Prisma + PostgreSQL
- AI: AI SDK (OpenAI gpt‑4o‑mini)
- Auth: NextAuth.js

### Key Libraries (by feature)
- AI / Chat:
  - `ai`, `@ai-sdk/openai`
- Presentations:
  - `platejs` (editor), `pptxgenjs` (export), `framer-motion`
- Quizzes:
  - `pdf-parse` (PDF text), `mammoth` (DOCX text), server extraction for PPTX/PDF
- UI / Accessibility:
  - `@radix-ui/*`, `lucide-react`, `tailwindcss`, `tailwind-merge`
- Data / State / Server:
  - `@prisma/client`, `zustand`, `@tanstack/react-query`, `next-auth`
- Misc:
  - `html2canvas-pro`, `date-fns`, `lodash.debounce`

## Quick Start

1) Install dependencies
```bash
pnpm install
```

2) Configure environment
Create `.env` with the following variables:
```env
DATABASE_URL=postgres://user:pass@host:5432/db
OPENAI_API_KEY=your_openai_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
UNSPLASH_ACCESS_KEY=optional
TAVILY_API_KEY=optional
TOGETHER_AI_API_KEY=optional
```

3) Generate Prisma client and push schema
```bash
pnpm db:push
```

4) Run the app
```bash
pnpm dev
```
Open http://localhost:3000

## Commands
- `pnpm dev` – start development server
- `pnpm build` – production build
- `pnpm start` – run production server
- `pnpm db:push` – push Prisma schema
- `pnpm lint` – lint

## Notes for Judges
- PDF/PPTX uploads are extracted on server and used for quizzes and chat context
- “Save conversation” creates a document you can revisit
- Presentation generator uses GPT‑4o‑mini and themed UI to match the rest of the app

## License
All rights reserved © Ali Ahmed. If you need a specific license applied, please advise.

---

## Environment & API Keys (details)

Required
- `DATABASE_URL`: PostgreSQL connection string for Prisma
- `OPENAI_API_KEY`: for AI responses (GPT‑4o‑mini via AI SDK)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: required for NextAuth

Optional (feature‑dependent)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: enable Google sign‑in (NextAuth)
- `UNSPLASH_ACCESS_KEY`: stock images for presentations
- `TAVILY_API_KEY`: web search during outline generation
- `TOGETHER_AI_API_KEY`: reserved for alternate providers

Security
- Keep keys in `.env` (never commit) and rotate as needed.
