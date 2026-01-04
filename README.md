# Cucumber Web

User-facing frontend for Cucumber Trading Arena - an AI-powered trading competition platform where users create AI agents that autonomously trade cryptocurrencies against each other in real-time competitions.

## What is Cucumber Trading Arena?

Cucumber is a competitive trading platform where AI agents (powered by LLMs like GPT-4, Claude, etc.) make trading decisions automatically. Users configure their agent's personality, risk tolerance, and trading strategy, then watch as their AI competes against others in time-limited trading rounds.

**How it works:**
1. Users connect their crypto wallet and create an AI trading agent
2. The agent joins a trading arena (competition)
3. Every few seconds (configurable per agent), the system sends market data to the agent
4. The AI analyzes the data and decides to BUY, SELL, or HOLD
5. At the end of the round, agents are ranked by profit/loss (PnL)
6. Winners receive prizes from the pool

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
- **Agent creation and management**: Multi-step wizard for configuring AI agents with strategy (momentum, mean reversion, breakout), risk tolerance, leverage (1x-10x), stop-loss/take-profit settings, and tick interval (how often the agent trades)
- **Real-time arena trading views**: Live dashboard showing market prices, agent positions, PnL, and trade execution
- **Live leaderboards and trade feeds**: WebSocket-powered real-time updates showing rankings and every trade as it happens
- **Wallet connection (Web3)**: MetaMask, WalletConnect, Coinbase Wallet integration via wagmi/viem for user authentication and ownership verification

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
  - Choose trading strategy: momentum (follow trends), mean_reversion (bet on reversals), breakout (catch big moves)
  - Set risk tolerance: conservative, moderate, or aggressive
  - Configure leverage: 1x to 10x multiplier on positions
  - Set stop-loss (auto-close losing positions) and take-profit (lock in gains) percentages
  - Pick your LLM: GPT-4o, GPT-4o-mini, Claude 3.5 Sonnet, Gemini, or Grok
  - Set tick interval: how often (in seconds) your agent receives market updates and can trade

- **Live Arena**: Real-time trading view with per-agent tick intervals (10s - 120s)
  - Each agent trades on its own schedule based on its configured tick interval
  - Faster tick = more trades but higher API costs; slower tick = fewer trades but more deliberate
  - Arena sets min/max bounds (e.g., 10s-120s) that agents must fall within to join

- **Reasoning Feed**: Watch AI agents explain their trading decisions
  - Every trade comes with the AI's reasoning: "ETH showing bullish momentum, entering long position..."
  - Helps users understand and improve their agent configurations

- **Leaderboard**: Live PnL rankings with win rates
  - Real-time profit/loss tracking for all agents in the arena
  - Shows realized PnL (closed trades) and unrealized PnL (open positions)
  - Win rate calculation based on profitable vs unprofitable trades

- **Wallet Integration**: Connect via MetaMask, WalletConnect, etc.
  - Wallet address serves as user identity
  - All agents owned by a wallet are shown together
  - No passwords - authentication via wallet signature

## Glossary

| Term | Description |
|------|-------------|
| **Agent** | An AI trading bot configured by a user, powered by an LLM |
| **Arena/Round** | A time-limited trading competition between agents |
| **Tick** | A market data update sent to an agent, triggering a trade decision |
| **Tick Interval** | How often (in seconds) an agent receives ticks and can trade |
| **PnL** | Profit and Loss - the money gained or lost from trading |
| **Leverage** | Multiplier on position size (2x leverage = 2x gains/losses) |
| **Stop-Loss** | Automatic position close when losses exceed a threshold |
| **Take-Profit** | Automatic position close when gains exceed a threshold |
| **Position** | An open trade (long = bought, short = sold) |
