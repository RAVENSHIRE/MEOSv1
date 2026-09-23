# MEOSv1 — Autonomous Solana Trading Bot

A browser-based dashboard for an autonomous Solana trading bot with two strategies:
- **Suck up the Rent** — Delta-neutral fee farming on extreme volume spikes
- **Reversal Sniper** — Token floor detection with wash-trade filtering

Built with React + TypeScript + Tailwind CSS + @solana/web3.js.

## Quick Start (Browser Preview)

The app runs immediately in preview mode with a simulated wallet and Solana Devnet RPC — no configuration needed.

```bash
npm install
npm run dev
```

Open the displayed URL in your browser. The dashboard shows:
- Live RPC connection status and wallet balance
- Toggle switches for both strategies
- Real-time terminal logging of bot scans and simulated trades
- Stats panel with scan count, trade count, PnL, and uptime

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `VITE_PRIVATE_KEY` | Solana wallet private key (JSON array) | Generated dummy keypair |

If variables are not set, the app automatically uses Devnet RPC and a generated dummy keypair (dry-run mode).

## Deploy to a Linux VPS

### 1. Download the code

Download the project as a ZIP from Bolt (Export button), then upload it to your VPS:

```bash
# On your VPS
unzip meos-v1.zip -d meos-v1
cd meos-v1
```

### 2. Install Node.js and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### 3. Configure environment

```bash
cp .env.example .env
nano .env
```

Set your values:

```env
VITE_RPC_URL=https://your-rpc-endpoint.com
VITE_PRIVATE_KEY=[your,private,key,array]
```

To generate a new keypair for the bot (recommended):
```bash
node -e "const kp = require('@solana/web3.js').Keypair.generate(); console.log(JSON.stringify(Array.from(kp.secretKey)))"
```

### 4. Install dependencies and build

```bash
npm install
npm run build
```

### 5. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # follow the printed instructions to enable auto-start on boot
```

### 6. Monitor

```bash
pm2 logs meos-v1          # view live logs
pm2 status                # check status
pm2 monit                 # real-time monitor
pm2 stop meos-v1          # stop the bot
pm2 restart meos-v1       # restart the bot
```

The dashboard will be available at `http://YOUR_VPS_IP:4173`.

### Optional: Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Strategies

### Suck up the Rent (Fee Farming)
Scans for tokens with extreme volume spikes (3x+ above baseline) and sufficient liquidity. Executes delta-neutral swap arbitrage to capture transaction fees during high-volume events.

### Reversal Sniper
Detects tokens that have dropped 15%+ in the last hour, filters out wash-traded tokens, and identifies floor formations for limit buy entries.

## Architecture

```
src/
├── App.tsx              # Main dashboard layout
├── config.ts            # Solana connection + env var loading
├── types.ts             # TypeScript type definitions
├── botEngine.ts         # Strategy scanning logic + mock market data
├── useBotEngine.ts      # React hook: bot loop, state, logging
├── components/
│   ├── Header.tsx       # RPC status, wallet, balance
│   ├── ControlPanel.tsx # Strategy toggles + start/stop
│   ├── Terminal.tsx     # Live log output
│   ├── StatsBar.tsx     # Aggregate stats
│   └── SignalFeed.tsx   # Recent trade signals
server.ts               # Standalone Node.js server for VPS
ecosystem.config.js     # PM2 process config
```

## Disclaimer

This software is for educational purposes only. It is not financial advice. Trading cryptocurrencies involves significant risk. The dry-run mode simulates trades with mock data — no real transactions are executed unless a valid private key is provided and live mode is explicitly enabled.
