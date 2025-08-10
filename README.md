# Slide Builder

An AI-powered slide presentation builder using Reveal.js and Vite.

## Overview

This is a web application that provides a "Cursor for slides" - an interface where AI agents can create and edit presentation slides through a tool-based API rather than direct code manipulation.

## Features

- **Sidebar Interface**: Control panel for slide management
- **Reveal.js Integration**: Professional presentation framework
- **Tool-based API**: AI agents interact through predefined functions
- **Real-time Updates**: Instant slide preview as you build

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build

```bash
npm run build
```

## How It Works

The application provides a set of tools that AI agents can call to manipulate slides:

- `addSlide(content)` - Create new slides
- `updateSlide(index, content)` - Edit existing slides  
- `deleteSlide(index)` - Remove slides
- `getSlideContent(index)` - Read slide content

See `SLIDE_TOOLS.md` for the complete tool specification.

## Project Structure

```
slide-builder/
├── index.html          # Main HTML with sidebar and reveal container
├── src/
│   ├── main.js        # Core logic and tool implementations
│   └── style.css      # Layout and styling
├── SLIDE_TOOLS.md     # AI tool specifications
└── README.md          # This file
```

## Usage

1. Click "Add Slide" to create new slides manually
2. Click any slide in the sidebar list to navigate to it
3. Use arrow keys or Reveal.js controls for presentation mode

## AI Integration

The system is designed for AI agents to build presentations by calling tools rather than editing code directly. Each tool has defined parameters and returns predictable results.

Example AI interaction:
```javascript
// AI calls the addSlide tool
{
  tool: "addSlide",
  parameters: {
    content: "<h1>My Presentation</h1><p>Welcome</p>"
  }
}
```

## Technologies

- **Vite** - Fast build tool and dev server
- **Reveal.js** - Presentation framework
- **Vanilla JavaScript** - No framework dependencies

## Future Enhancements

- LLM integration for natural language slide creation
- Export to PDF/PowerPoint
- Themes and templates
- Collaborative editing
- Version history