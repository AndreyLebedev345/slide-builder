# Slide Builder React

AI-powered presentation builder with React, TypeScript, and Reveal.js.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

- AI-powered slide creation through natural language
- Real-time slide preview with Reveal.js
- 12 presentation themes
- Collapsible sidebar navigation
- Iterative AI that can inspect and modify slides

## Usage

1. Enter your OpenAI API key when prompted
2. Use the chat interface to create slides:
   - "Create a title slide"
   - "Add 3 slides about product features"
   - "Update this slide"
   - "Change the theme"

## Tech Stack

- React 18 + TypeScript
- Vite
- shadcn/ui + Tailwind CSS
- Reveal.js
- OpenAI Responses API (GPT-5)

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Lint code
```

## Project Structure

```
src/
├── components/      # React components
├── lib/            # Utilities and tools
└── App.tsx         # Main app
```

## License

MIT