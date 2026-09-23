import type { MarketToken, TradeSignal, StrategyName } from "./types";
import { CONFIG } from "./config";

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
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

export function scanMarket(strategyName: StrategyName, tokens: MarketToken[]): TradeSignal[] {
  return strategyName === "rent"
    ? scanRentStrategy(tokens)
    : scanReversalStrategy(tokens);
}

export function formatLogTime(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
}
