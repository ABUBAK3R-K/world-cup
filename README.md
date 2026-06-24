# World Cup Draft XI

Build your ultimate Cricket World Cup squad, set your batting order, and simulate a tournament run against AI!

## Features

- **Drafting System**: Spin the wheel to get random countries and years, and pick your favorite players.
- **Team Builder**: Set your batting order (Top Order, Middle Order, Lower Order) with drag-and-drop functionality.
- **Match Simulation**: Simulate your team's performance against historic World Cup teams in a group stage, quarter-final, semi-final, and final.
- **Player Cards**: View your drafted players in a beautiful, trading-card style layout with their dynamic stats and attributes.
- **Sharing**: Share your tournament results and team seed with friends.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite (embedded, read-only at runtime)
- **Animation**: Framer Motion
- **Drag and Drop**: dnd-kit

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

The application is highly optimized for deployment on Vercel. Because the historical cricket data is pre-seeded into an embedded SQLite database (`prisma/dev.db`), it requires no external database connections and operates well within Vercel's serverless size constraints.

To deploy on Vercel:
1. Push your code to GitHub.
2. Import the project into Vercel.
3. Vercel will automatically run `npm run build` to build and deploy the app.
