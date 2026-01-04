# Cucumber Web

Frontend dashboard for Cucumber Trade Arena.

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## Environment Variables

See `.env.example` for required configuration.

## Pages

- `/` - Home page with active round and quick actions
- `/arena/[roundId]` - Live arena dashboard
- `/agents` - Agent list
- `/agents/create` - Agent creation wizard
- `/leaderboard` - Global leaderboard

## Features

- Real-time WebSocket updates
- Agent reasoning feed
- Trade history
- Leaderboard
- Agent creation wizard
