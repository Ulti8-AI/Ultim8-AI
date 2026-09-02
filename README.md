# Ultim8 AI v2

A real AI-powered Ultim8 workspace.

## What is included

- Real AI chat through a server-side API
- Conversation history
- Personalization modes: Business, Work, Study, Creative, Fun, Programming, Planning, Custom
- General mode as the default (not a personalization card)
- Create workspace powered by AI
- Codex/programming assistant
- Image generation endpoint
- Music concept generation
- Finance Diary with local storage
- Library for saved AI outputs
- Schedule
- Projects
- Plugins page
- Responsive polished UI
- Backend health check and Test AI button

## Setup

1. Install Node.js.
2. Open a terminal in this folder.
3. Run:

   npm install

4. Copy `.env.example` to `.env`.
5. Put your API key in `.env`.
6. Start:

   npm start

7. Open:

   http://localhost:3000

## Important

Never put your API key into index.html and never publish `.env`.

The frontend talks to the local server. The server talks to the AI API.

If your account/model access differs, change TEXT_MODEL or IMAGE_MODEL in `.env`.

For a public deployment, add authentication, rate limiting, usage limits, logging, and proper user data storage before opening it to everyone.
