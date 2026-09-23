export type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR" | "TRADE" | "SCAN" | "SYSTEM";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  strategy?: StrategyName;
}

export type StrategyName = "rent" | "reversal";
export type StrategyState = "idle" | "running" | "paused";

export interface StrategyConfig {
  name: StrategyName;
  label: string;
  description: string;
  enabled: boolean;
  state: StrategyState;
  trades: number;
  pnl: number;
  winRate: number;
}

export interface BotStats {
  totalScans: number;
  totalTrades: number;
  totalPnl: number;
  uptime: number;
  solBalance: number;
  rpcConnected: boolean;
  rpcLatency: number;
  currentSlot: number;
  tps: number;
}

export interface MarketToken {
  symbol: string;
  address: string;
  price: number;
  volume24h: number;
  volumeSpike: number;
  liquidity: number;
  priceChange1h: number;
  priceChange5m: number;
  isWashTraded: boolean;
  floorDetected: boolean;
}

export interface TradeSignal {
  strategy: StrategyName;
  token: string;
  action: string;
  size: number;
  expectedFee: number;
  confidence: number;
  reason: string;
}
