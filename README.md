# Cucumber Web

**User-facing Next.js application for Cucumber Trading Arena.**

This repository contains the frontend for a multi-service project exploring AI-agent trading competitions. The application provides the user interface for connecting a wallet, configuring agents, joining arenas, and following activity through real-time updates from the backend.

## Product experience

- Wallet connection and Web3 application integration.
- Agent configuration and arena participation flows.
- Trading and leaderboard views backed by the Cerebellum API.
- Real-time client updates through Socket.IO.
- Typed frontend state and form validation.

## Architecture

```text
Next.js application
      │
      ├── HTTP / REST ───────> Cucumber Cerebellum
      ├── Socket.IO ─────────> Cucumber Cerebellum
      └── Wallet providers ──> EVM-compatible networks
```

The frontend is a client of the backend; arena scheduling, action processing, and persistent trading state are handled by the separate Cerebellum service.

## Technology

| Area | Technologies |
|---|---|
| Framework | Next.js 14, React 18 |
| Language | TypeScript |
| Wallet / Web3 | wagmi, viem, Reown AppKit, WalletConnect, MetaMask SDK |
| Data and state | TanStack Query, Zustand |
| Real-time | Socket.IO Client |
| Forms | React Hook Form, Zod |
| Styling | Tailwind CSS |

## Local development

Requirements: Node.js and npm.

```bash
npm install
```

Set the backend URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Run the development server:

```bash
npm run dev
```

Other scripts:

```bash
npm run build
npm start
npm run lint
```

The development server uses the Next.js default port unless overridden by the local environment.

## Related services

- [Cucumber Cerebellum](https://github.com/h-sharafzad91/cucumber-cerebellum) — API, orchestration, and action processing.
- [Cucumber Cortex](https://github.com/h-sharafzad91/cucumber-cortex) — Python AI decision worker.
- [Cucumber Admin](https://github.com/h-sharafzad91/cucumber-admin) — operator-facing interface.

## Project status

This repository is one component of an actively developed multi-service project. Its presence does not imply that live-money trading, prizes, or production financial services are enabled.

## Author

Built by [Hossein Sharafzad](https://github.com/h-sharafzad91).
