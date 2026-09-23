import type { MarketToken, TradeSignal, StrategyName } from "./types";
import { CONFIG } from "./config";

const TOKEN_SYMBOLS = [
  "BONK", "WIF", "POPCAT", "MEW", "MOODENG", "GOAT", "SLERF", "PNUT",
  "FIDA", "JTO", "RAY", "ORCA", "MNGO", "JUP", "PYTH", "MEME",
  "BOME", "NOS", "HONEY", "WEN",
];

const MINT_ADDRESSES = [
  "DezXAZ8z7PnrnRJjz3DNXWbYsdkeM6k5tp5q3XpD9tqp",
  "EKpQGSJtjMFqWZ6Qb8T6Z2N6N6N6N6N6N6N6N6N6N6N6",
  "HeLp6N6N6N6N6N6N6N6N6N6N6N6N6N6N6N6N6N6N6N6",
  "9BB6NFEauh5N6N6N6N6N6N6N6N6N6N6N6N6N6N6N6N6N",
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMockTokens(count: number): MarketToken[] {
  const tokens: MarketToken[] = [];
  for (let i = 0; i < count; i++) {
    const baseVolume = randomFloat(10000, 5000000);
    const volumeSpike = randomFloat(0.5, 8.0);
    const priceChange1h = randomFloat(-30, 30);
    const priceChange5m = randomFloat(-12, 12);
    const isWashTraded = Math.random() < 0.25;

    tokens.push({
      symbol: randomElement(TOKEN_SYMBOLS),
      address: randomElement(MINT_ADDRESSES),
      price: randomFloat(0.00001, 15),
      volume24h: baseVolume,
      volumeSpike,
      liquidity: randomFloat(5000, 500000),
      priceChange1h,
      priceChange5m,
      isWashTraded,
      floorDetected: priceChange1h < -15 && priceChange5m > -2 && !isWashTraded,
    });
  }
  return tokens;
}

export function scanRentStrategy(tokens: MarketToken[]): TradeSignal[] {
  const signals: TradeSignal[] = [];
  const cfg = CONFIG.strategies.rent;

  for (const token of tokens) {
    if (token.volumeSpike >= cfg.minVolumeSpike && token.liquidity >= cfg.minLiquidityUsd) {
      const expectedFee = token.volume24h * (cfg.feeBps / 10000) * randomFloat(0.01, 0.05);
      signals.push({
        strategy: "rent",
        token: token.symbol,
        action: "SWAP_ARBITRAGE",
        size: randomFloat(0.5, 5),
        expectedFee,
        confidence: randomFloat(0.6, 0.95),
        reason: `Volume spike ${token.volumeSpike.toFixed(2)}x on ${token.symbol} — liquidity $${(token.liquidity / 1000).toFixed(1)}k`,
      });
    }
  }
  return signals;
}

export function scanReversalStrategy(tokens: MarketToken[]): TradeSignal[] {
  const signals: TradeSignal[] = [];
  const cfg = CONFIG.strategies.reversal;

  for (const token of tokens) {
    if (
      token.priceChange1h <= -cfg.minPriceDropPct &&
      token.liquidity >= cfg.minLiquidityUsd &&
      !token.isWashTraded &&
      token.floorDetected
    ) {
      signals.push({
        strategy: "reversal",
        token: token.symbol,
        action: "LIMIT_BUY_FLOOR",
        size: randomFloat(0.2, 3),
        expectedFee: 0,
        confidence: randomFloat(0.5, 0.88),
        reason: `Floor detected on ${token.symbol} after ${token.priceChange1h.toFixed(1)}% drop — wash-trade filtered`,
      });
    }
  }
  return signals;
}

export function scanMarket(strategyName: StrategyName): {
  tokens: MarketToken[];
  signals: TradeSignal[];
} {
  const tokens = generateMockTokens(randomInt(8, 16));
  const signals =
    strategyName === "rent"
      ? scanRentStrategy(tokens)
      : scanReversalStrategy(tokens);
  return { tokens, signals };
}

export function formatLogTime(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
}
