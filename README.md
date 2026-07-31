# AI Productivity Assistant

## Project overview

A modern, dark monochrome productivity workspace that bundles the everyday
writing, planning and research chores of knowledge work into one app. Instead of jumping
between a mail client, a notes app, a to-do list and a chatbot, you get five focused AI
tools behind a single sidebar, all sharing the same design system and local-first storage.

Everything you create — chats, email drafts and tasks — is stored in your browser, and
every AI output is presented as a starting point for review rather than a finished
deliverable (see the Responsible AI disclaimer on the overview page).

## Features

### Overview dashboard
- Single entry point to every tool, with a short description of what each one does.
- Responsible AI disclaimer covering review expectations, data handling and accountability.

### Email generator
- Describe the occasion and generate a polished, professional email.
- Choose tone and length to match the audience.
- Save drafts locally and reload or delete them from a saved-drafts gallery.

### Meeting notes summarizer
- Paste raw notes and get a structured summary.
- Extracts key points, decisions, action items and deadlines.
- Voice input: dictate notes and have them transcribed straight into the editor.

### Task planner
- Generates daily and weekly schedules from what you actually describe — no filler blocks.
- Fill a day with one click.
- Adjustable priority list per day with smooth drag-and-drop reordering, including across days.
- Marking a task done strikes out the matching schedule block.

### Research assistant
- Paste an article link and get a concise summary.
- Automatically suggests related reading — no extra prompting needed.
- Recommendations are clickable and open the source in a new tab.

### Assistant chat (Mono)
- Threaded conversations with streaming replies, saved between visits.
- Warm, concise, human tone — with the occasional work-appropriate joke.
- Starter prompts for drafting, prioritising and sanity-checking work.

### Across the app
- Dark monochrome design system with a soft crimson gradient wash.
- Responsive layout; the mobile sidebar closes instantly when navigating.
- Careful text-overflow and layout-shift handling, with skeletons while AI generates.
- Local-first storage for chats, drafts and tasks.

## Tools used

| Area | Technology |
| --- | --- |
| Framework | TanStack Start (TanStack Router, SSR + server functions) |
| Build tool | Vite 7 |
| Language | TypeScript |
| UI library | React 19 |
| Styling | Tailwind CSS v4 with OKLCH design tokens |
| Components | shadcn/ui + Radix UI primitives |
| Icons | lucide-react |
| AI | Lovable AI Gateway via the Vercel AI SDK (`@ai-sdk/react`, `@ai-sdk/openai-compatible`) |
| Speech-to-text | Whisper transcription endpoint (`/api/transcribe`) |
| Storage | Browser localStorage (chats, drafts, tasks) |
| Notifications | Sonner |
| Tooling | ESLint, Prettier, Bun |

## Setup instructions

### Prerequisites
- [Bun](https://bun.sh) (or Node.js 20+ with npm)
- A `LOVABLE_API_KEY` for the AI Gateway (already provided in the Lovable environment)

### Install and run

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <project-folder>

# 2. Install dependencies
bun install        # or: npm install

# 3. Configure environment variables
cp .env.example .env   # if present, otherwise create .env
# then add:
# LOVABLE_API_KEY=your-key-here

# 4. Start the dev server
bun run dev        # or: npm run dev
```

The app runs at **http://localhost:8080**.

### Other scripts

```bash
bun run build      # production build
bun run preview    # preview the production build
bun run lint       # ESLint
bun run format     # Prettier
```

### Notes
- AI features require a valid `LOVABLE_API_KEY`; without it the tool pages render but
  generation requests fail.
- Chats, drafts and tasks live in browser localStorage, so clearing site data clears them.

## Built by
- Lovable


