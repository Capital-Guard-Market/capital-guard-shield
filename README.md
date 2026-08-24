# CapitalGuard Arena

Build the MVP for "CapitalGuard: Practice With Consequences" — a discipline-first F&O and Equity trading simulator web application.

1. THEME & STYLING:

- Deep Dark Fintech Mode: Background #0B0E14, Card surfaces #151A23, Borders #222B3A, Primary accent Light Sky Blue #38BDF8, Profit Green #22C55E, Loss Red #EF4444, Warning Amber #F59E0B.

- Clean typography with monospace numbers for prices and P&L.

- Clean bottom navigation bar or top header with: Terminal, Watchlist, Journal Calendar, and Profile (Ghost Debt).

2. CORE INTERACTIVE SCREENS & FLOW TO BUILD:

- Screen 1: App Home / Mode Selector

  - Card A: "Equity Investments" (Track stock trajectory over time).

  - Card B: "F&O Trading" (Live simulation with daily risk limits).

  - Tapping F&O Trading goes to Arena Selector.

- Screen 2: Choose Your Arena

  - Options Arena (₹10,00,000 virtual balance).

  - Futures Arena (₹50,00,000 virtual balance).

  - Tapping either moves to the Daily Risk Gate.

- Screen 3: Daily Risk Gate (Mandatory Guardrail)

  - 3 Tiers: Conservative (5% • ₹5,000 max loss), Balanced (10% • ₹10,000 max loss), Aggressive (20% • ₹20,000 max loss).

  - Selecting a tier locks it for the session and opens the Live Terminal.

- Screen 4: Live F&O Terminal & Option Chain

  - Header: NIFTY 24,780.35 (+0.42%) | 28 AUG EXPIRY.

  - Option Chain table with CE LTP, Strike, PE LTP.

  - Tapping ATM strike (24,800 CE @ ₹121.90) opens an order ticket for 65 qty (1 lot).

  - Clicking "BUY 24,800 CE" opens the Active Position screen.

- Screen 5: Active Position & Simulated Drawdown

  - Shows NIFTY 24,800 CE position with live updating P&L.

  - Include an "Exit Position" button.

  - Include a test button: "Simulate Loss & Trigger Shield Lockout".

- Screen 6: Shield Active Lockout Screen

  - Full-screen takeover with glowing Shield icon.

  - Text: "Shield Active - Your remaining capital is safe."

  - Shows "Capital Saved Today: ₹9,000".

  - Countdown timer to midnight.

  - All buy/sell buttons are completely locked and hidden.

- Screen 7: Profile & Ghost Debt Ledger

  - Shows Ghost Debt: ₹38,50,000 with a note: "Grows from margin breaches, shrinks with disciplined profitable days".

Make all screens fully clickable so I can test the full trading flow from Arena -> Risk Gate -> Terminal -> Position -> Shield Lockout in the browser.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://capital-guard-shield.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d269e6bb-b41b-4025-8f49-f52da0739318).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
