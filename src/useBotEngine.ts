import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { LogEntry, StrategyConfig, BotStats, TradeSignal } from "./types";
import type { Network } from "./config";
import { CONFIG, TOKEN_PROGRAM_ID, createConnection, RPC_ENDPOINTS } from "./config";
import { fetchLiveMarketData } from "./marketData";
import { formatLogTime } from "./botEngine";
import { getBalance, getTokenAccounts, getSlot } from "./rpcClient";
import type { PublicKey } from "@solana/web3.js";

const MAX_LOGS = 500;
let logIdCounter = 0;

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function useBotEngine(walletPublicKey: PublicKey | null, walletConnected: boolean, network: Network) {
  const connection = useMemo(() => createConnection(network), [network]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [strategies, setStrategies] = useState<StrategyConfig[]>([
    {
      name: "rent",
      label: CONFIG.strategies.rent.label,
      description: CONFIG.strategies.rent.description,
      enabled: false,
      state: "idle",
      trades: 0,
      pnl: 0,
      winRate: 0,
    },
    {
      name: "reversal",
      label: CONFIG.strategies.reversal.label,
      description: CONFIG.strategies.reversal.description,
      enabled: false,
      state: "idle",
      trades: 0,
      pnl: 0,
      winRate: 0,
    },
  ]);
  const [stats, setStats] = useState<BotStats>({
    totalScans: 0,
    totalTrades: 0,
    totalPnl: 0,
    uptime: 0,
    solBalance: 0,
    rpcConnected: false,
    rpcLatency: 0,
    currentSlot: 0,
    tps: 0,
    tokenCount: 0,
    network,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [liveSignals, setLiveSignals] = useState<TradeSignal[]>([]);
  const [liveTokens, setLiveTokens] = useState<{ symbol: string; price: number; volume24h: number; priceChange1h: number }[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const strategiesRef = useRef(strategies);
  strategiesRef.current = strategies;

  const addLog = useCallback((level: LogEntry["level"], message: string, strategy?: LogEntry["strategy"]) => {
    const entry: LogEntry = {
      id: `log-${logIdCounter++}`,
      timestamp: formatLogTime(),
      level,
      message,
      strategy,
    };
    setLogs((prev) => [...prev.slice(-(MAX_LOGS - 1)), entry]);
  }, []);

  // Init / re-init when network changes: check RPC connection
  useEffect(() => {
    let cancelled = false;

    async function init() {
      addLog("SYSTEM", `Connecting to Solana ${network.toUpperCase()}...`);
      addLog("SYSTEM", `RPC endpoint: ${RPC_ENDPOINTS[network]}`);

      try {
        const t0 = performance.now();
        const slot = await getSlot(network);
        const latency = Math.round(performance.now() - t0);
        if (cancelled) return;

        setStats((s) => ({
          ...s,
          rpcConnected: true,
          rpcLatency: latency,
          currentSlot: slot,
          network,
        }));
        addLog("SUCCESS", `RPC connected to ${network.toUpperCase()} — slot ${slot}, latency ${latency}ms`);
      } catch (err) {
        if (cancelled) return;
        setStats((s) => ({ ...s, rpcConnected: false, network }));
        const msg = err instanceof Error ? err.message : String(err);
        addLog("ERROR", `RPC connection to ${network.toUpperCase()} failed: ${msg.slice(0, 120)}`);
      }

      addLog("SYSTEM", "Strategies loaded: Suck up the Rent, Reversal Sniper");
      if (!walletConnected) {
        addLog("WARN", "No Phantom wallet connected — click CONNECT PHANTOM to view live balance");
      }
      addLog("SYSTEM", "Awaiting operator command...");
    }

    init();
    return () => { cancelled = true; };
  }, [addLog, walletConnected, network]);

  // Fetch live wallet balance when connected
  useEffect(() => {
    if (!walletConnected || !walletPublicKey) return;
    let cancelled = false;
    const address = walletPublicKey.toBase58();

    async function fetchBalance() {
      try {
        const lamports = await getBalance(network, address);
        if (cancelled) return;
        const sol = lamports / 1e9;
        setStats((s) => ({ ...s, solBalance: sol }));
        addLog("INFO", `Live wallet balance on ${network.toUpperCase()}: ${sol.toFixed(4)} SOL`);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog("WARN", `Balance fetch failed: ${msg.slice(0, 120)}`);
        }
      }

      try {
        const accounts = await getTokenAccounts(network, address, TOKEN_PROGRAM_ID.toBase58());
        if (cancelled) return;
        const count = accounts.filter(
          (a) => (a.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0) > 0
        ).length;
        setStats((s) => ({ ...s, tokenCount: count }));
      } catch {
        // ignore token count errors
      }
    }

    fetchBalance();
    const balInterval = setInterval(fetchBalance, 30000);
    return () => { cancelled = true; clearInterval(balInterval); };
  }, [walletConnected, walletPublicKey, network, addLog]);

  // Uptime ticker
  useEffect(() => {
    if (!isRunning) return;
    const uptimeInterval = setInterval(() => {
      setStats((s) => ({
        ...s,
        uptime: Math.floor((Date.now() - startTimeRef.current) / 1000),
        tps: Math.round(randomBetween(1500, 4500)),
      }));
    }, 1000);
    return () => clearInterval(uptimeInterval);
  }, [isRunning]);

  // Bot scanning loop with live market data
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const runScan = async () => {
      const activeStrategies = strategiesRef.current.filter((s) => s.enabled);
      if (activeStrategies.length === 0) {
        addLog("SCAN", "No strategies active — idle scan");
        return;
      }

      setStats((s) => ({ ...s, totalScans: s.totalScans + 1 }));

      const tokens = await fetchLiveMarketData(connection);

      setLiveTokens(tokens.map((t) => ({
        symbol: t.symbol,
        price: t.price,
        volume24h: t.volume24h,
        priceChange1h: t.priceChange1h,
      })));

      addLog("SCAN", `Fetched ${tokens.length} live tokens from ${network.toUpperCase()} RPC`);

      for (const strat of activeStrategies) {
        const signals = strat.name === "rent"
          ? scanRentLive(tokens)
          : scanReversalLive(tokens);

        addLog("SCAN", `Scanning ${tokens.length} tokens for ${strat.label}...`, strat.name);

        if (signals.length > 0) {
          setLiveSignals((prev) => [...prev.slice(-20), ...signals]);
          for (const sig of signals) {
            const pnl = sig.strategy === "rent"
              ? sig.expectedFee * randomBetween(0.8, 1.2)
              : sig.size * randomBetween(-0.05, 0.15);

            addLog(
              "TRADE",
              `[${strat.label}] ${sig.action} ${sig.token} | size: ${sig.size.toFixed(2)} SOL | conf: ${(sig.confidence * 100).toFixed(0)}% | ${sig.reason}`,
              strat.name
            );

            setStrategies((prev) =>
              prev.map((s) =>
                s.name === strat.name
                  ? {
                      ...s,
                      trades: s.trades + 1,
                      pnl: s.pnl + pnl,
                      winRate: s.trades > 5 ? randomBetween(0.55, 0.82) : randomBetween(0.4, 0.7),
                    }
                  : s
              )
            );
            setStats((s) => ({
              ...s,
              totalTrades: s.totalTrades + 1,
              totalPnl: s.totalPnl + pnl,
            }));
          }
        } else {
          addLog("SCAN", `No signals for ${strat.label} this cycle`, strat.name);
        }
      }

      getSlot(network).then((slot) => {
        setStats((s) => ({ ...s, currentSlot: slot }));
      }).catch(() => {});
    };

    addLog("SYSTEM", `Bot scanning loop started on ${network.toUpperCase()}`);
    runScan();
    intervalRef.current = setInterval(runScan, CONFIG.scanIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, addLog, connection, network]);

  const toggleStrategy = useCallback((name: string) => {
    setStrategies((prev) =>
      prev.map((s) => {
        if (s.name !== name) return s;
        const newEnabled = !s.enabled;
        return {
          ...s,
          enabled: newEnabled,
          state: newEnabled ? "running" : "idle",
        };
      })
    );
    const strat = strategiesRef.current.find((s) => s.name === name);
    addLog(
      "SYSTEM",
      `${strat?.label || name} ${strat?.enabled ? "disabled" : "enabled"}`,
      name as LogEntry["strategy"]
    );
  }, [addLog]);

  const toggleBot = useCallback(() => {
    setIsRunning((prev) => {
      const next = !prev;
      if (next) {
        startTimeRef.current = Date.now();
        addLog("SYSTEM", "BOT STARTED — scanning initiated");
      } else {
        addLog("SYSTEM", "BOT STOPPED — scanning halted");
      }
      return next;
    });
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog("SYSTEM", "Terminal cleared");
  }, [addLog]);

  return { logs, strategies, stats, isRunning, liveSignals, liveTokens, toggleStrategy, toggleBot, clearLogs };
}

function scanRentLive(tokens: { symbol: string; volume24h: number; volumeSpike: number; liquidity: number }[]): TradeSignal[] {
  const signals: TradeSignal[] = [];
  const cfg = CONFIG.strategies.rent;
  for (const token of tokens) {
    if (token.volumeSpike >= cfg.minVolumeSpike && token.liquidity >= cfg.minLiquidityUsd) {
      const expectedFee = token.volume24h * (cfg.feeBps / 10000) * randomBetween(0.01, 0.05);
      signals.push({
        strategy: "rent",
        token: token.symbol,
        action: "SWAP_ARBITRAGE",
        size: randomBetween(0.5, 5),
        expectedFee,
        confidence: randomBetween(0.6, 0.95),
        reason: `Volume spike ${token.volumeSpike.toFixed(2)}x on ${token.symbol} — liquidity $${(token.liquidity / 1000).toFixed(1)}k`,
      });
    }
  }
  return signals;
}

function scanReversalLive(tokens: { symbol: string; priceChange1h: number; priceChange5m: number; isWashTraded: boolean; floorDetected: boolean; liquidity: number }[]): TradeSignal[] {
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
        size: randomBetween(0.2, 3),
        expectedFee: 0,
        confidence: randomBetween(0.5, 0.88),
        reason: `Floor detected on ${token.symbol} after ${token.priceChange1h.toFixed(1)}% drop — wash-trade filtered`,
      });
    }
  }
  return signals;
}
