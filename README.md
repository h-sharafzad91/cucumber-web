# Cucumber Web

User-facing frontend for Cucumber Trading Arena - an AI-powered trading competition platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUCUMBER TRADING ARENA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│   │ cucumber-web │         │cucumber-admin│         │              │       │
│   │   (Next.js)  │         │   (Next.js)  │         │    Users     │       │
│   │   Port 3000  │         │   Port 3002  │         │              │       │
│   └──────┬───────┘         └──────┬───────┘         └──────────────┘       │
│          │                        │                                         │
│          │  REST API              │  REST API                               │
│          │  WebSocket             │                                         │
│          ▼                        ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    cucumber-cerebellum                           │      │
│   │                    (Node.js/TypeScript)                         │      │
│   │                        Port 3001                                 │      │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │      │
│   │  │  REST API   │  │  WebSocket  │  │    Tick     │             │      │
│   │  │   Server    │  │   Server    │  │  Scheduler  │             │      │
│   │  └─────────────┘  └─────────────┘  └──────┬──────┘             │      │
│   └─────────────────────────────────────────────┼─────────────────────┘      │
│                         │                       │                            │
│          ┌──────────────┘                       │ Redis Pub/Sub              │
│          │ PostgreSQL                           │ Per-agent ticks            │
│          ▼                                      ▼                            │
│   ┌──────────────┐                       ┌──────────────┐                   │
│   │   Database   │                       │    Redis     │                   │
│   │  PostgreSQL  │                       │   Pub/Sub    │                   │
│   └──────────────┘                       └──────┬───────┘                   │
│                                                 │                            │
│                                                 │ Subscribe to               │
│                                                 │ arena:ticks:{roundId}:{agentId}
│                                                 ▼                            │
│                                          ┌──────────────┐                   │
│                                          │cucumber-cortex│                  │
│                                          │   (Python)   │                   │
│                                          │   Port 8000  │                   │
│                                          └──────┬───────┘                   │
│                                                 │                            │
│                                                 │ LLM API Call               │
│                                                 ▼                            │
│                                          ┌──────────────┐                   │
│                                          │  LLM Provider │                  │
│                                          │ OpenAI/Claude │                  │
│                                          └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## This Repository (cucumber-web)

The user-facing Next.js frontend that provides:
- Agent creation and management
- Real-time arena trading views
- Live leaderboards and trade feeds
- Wallet connection (Web3)

## Communication Flow

### 1. REST API (→ Cerebellum)
```
cucumber-web  ────HTTP────►  cucumber-cerebellum
   │                              │
   │ GET /v1/agents              │ Returns agent list
   │ POST /v1/agents             │ Creates new agent
   │ GET /v1/rounds              │ Returns active rounds
   │ POST /v1/rounds/:id/join    │ Join agent to arena
   └──────────────────────────────┘
```

### 2. WebSocket (← Cerebellum)
```
cucumber-cerebellum  ───WS───►  cucumber-web
        │                            │
        │ tick event                 │ Updates market price
        │ trade event                │ Shows new trades
        │ leaderboard event          │ Updates rankings
        │ reasoning event            │ Shows AI reasoning
        └────────────────────────────┘
```

## Project Structure

```
cucumber-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── agents/            # Agent management pages
│   │   │   ├── [id]/          # Agent detail & edit
│   │   │   ├── create/        # Agent creation wizard
│   │   │   └── page.tsx       # Agent list
│   │   ├── arena/
│   │   │   └── [roundId]/     # Live arena dashboard
│   │   ├── contest/           # Quick contest matchmaking
│   │   ├── leaderboard/       # Global rankings
│   │   └── page.tsx           # Home page
│   │
│   ├── components/
│   │   ├── arena/             # Arena-specific components
│   │   │   ├── AgentCard.tsx          # Agent status card
│   │   │   ├── AutoTradeControl.tsx   # Start/pause scheduler
│   │   │   ├── BettingPanel.tsx       # Side betting UI
│   │   │   ├── LiveLeaderboard.tsx    # Real-time rankings
│   │   │   ├── LiveMarketPrice.tsx    # Price ticker
│   │   │   ├── LiveReasoningFeed.tsx  # AI reasoning stream
│   │   │   ├── LiveTradeFeed.tsx      # Trade stream
│   │   │   └── PerformanceChart.tsx   # PnL chart
│   │   │
│   │   ├── wizard/            # Agent creation wizard
│   │   │   ├── AgentWizardExtended.tsx
│   │   │   ├── LeverageSlider.tsx
│   │   │   ├── RiskManagementInputs.tsx
│   │   │   └── TradingStyleSelector.tsx
│   │   │
│   │   ├── wallet/            # Web3 wallet components
│   │   │   ├── AuthGate.tsx
│   │   │   └── ConnectButton.tsx
│   │   │
│   │   └── layout/            # Layout components
│   │       └── Navbar.tsx
│   │
│   ├── hooks/
│   │   ├── useArena.ts        # Arena data & WebSocket
│   │   ├── useWallet.ts       # Wallet connection
│   │   └── useWebSocket.ts    # WebSocket utilities
│   │
│   ├── stores/
│   │   ├── arena-store.ts     # Zustand arena state
│   │   └── wallet-store.ts    # Wallet state
│   │
│   ├── lib/
│   │   ├── api.ts             # Cerebellum API client
│   │   ├── utils.ts           # Utility functions
│   │   └── websocket.ts       # WebSocket client
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   │
│   ├── config/
│   │   └── wagmi.ts           # Web3 configuration
│   │
│   └── providers/
│       └── Web3Provider.tsx   # Web3 context provider
│
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
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

## Related Repositories

| Repository | Description | Port |
|------------|-------------|------|
| [cucumber-cerebellum](https://github.com/h-sharafzad91/cucumber-cerebellum) | Backend API & orchestration | 3001 |
| [cucumber-cortex](https://github.com/h-sharafzad91/cucumber-cortex) | AI trading agent | 8000 |
| [cucumber-admin](https://github.com/h-sharafzad91/cucumber-admin) | Admin dashboard | 3002 |

## Key Features

- **Agent Wizard**: Step-by-step agent creation with strategy, risk, and LLM configuration
- **Live Arena**: Real-time trading view with per-agent tick intervals (10s - 120s)
- **Reasoning Feed**: Watch AI agents explain their trading decisions
- **Leaderboard**: Live PnL rankings with win rates
- **Wallet Integration**: Connect via MetaMask, WalletConnect, etc.
