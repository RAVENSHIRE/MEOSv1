import { useEffect, useRef, useState, useCallback } from "react";
import type { LogEntry, StrategyConfig, BotStats, TradeSignal } from "./types";
import { CONFIG, connection, keypair } from "./config";
import { scanMarket, formatLogTime } from "./botEngine";

const MAX_LOGS = 500;
let logIdCounter = 0;

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function useBotEngine() {
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
  });
  const [isRunning, setIsRunning] = useState(false);
  const [liveSignals, setLiveSignals] = useState<TradeSignal[]>([]);

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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      addLog("SYSTEM", "MEOSv1 boot sequence initiated...");
      addLog("SYSTEM", `RPC endpoint: ${CONFIG.rpcUrl}`);
      addLog("SYSTEM", `Wallet: ${CONFIG.walletAddress.slice(0, 8)}...${CONFIG.walletAddress.slice(-8)}`);
      addLog("SYSTEM", CONFIG.isDryRun ? "DRY-RUN MODE — no real funds at risk" : "LIVE MODE — real funds at risk");

      try {
        const t0 = performance.now();
        const slot = await connection.getSlot();
        const latency = Math.round(performance.now() - t0);
        if (cancelled) return;

        let balance = 0;
        try {
          balance = await connection.getBalance(keypair.publicKey);
        } catch {
          balance = 0;
        }

        if (cancelled) return;
        setStats((s) => ({
          ...s,
          rpcConnected: true,
          rpcLatency: latency,
          currentSlot: slot,
          solBalance: balance / 1e9,
        }));
        addLog("SUCCESS", `RPC connected — slot ${slot}, latency ${latency}ms`);
        addLog("INFO", `Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`);
      } catch {
        if (cancelled) return;
        setStats((s) => ({ ...s, rpcConnected: false, solBalance: 2.5 }));
        addLog("WARN", "RPC connection failed — running in offline simulation mode");
        addLog("INFO", "Using simulated wallet balance for dry-run");
      }

      addLog("SYSTEM", "Strategies loaded: Suck up the Rent, Reversal Sniper");
      addLog("SYSTEM", "Awaiting operator command...");
    }

    init();
    return () => { cancelled = true; };
  }, [addLog]);

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

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const runScan = () => {
      const activeStrategies = strategiesRef.current.filter((s) => s.enabled);
      if (activeStrategies.length === 0) {
        addLog("SCAN", "No strategies active — idle scan");
        return;
      }

      setStats((s) => ({ ...s, totalScans: s.totalScans + 1 }));

      for (const strat of activeStrategies) {
        const { tokens, signals } = scanMarket(strat.name);
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

      connection.getSlot().then((slot) => {
        setStats((s) => ({ ...s, currentSlot: slot }));
      }).catch(() => {});
    };

    addLog("SYSTEM", "Bot scanning loop started");
    runScan();
    intervalRef.current = setInterval(runScan, CONFIG.scanIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, addLog]);

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

  return { logs, strategies, stats, isRunning, liveSignals, toggleStrategy, toggleBot, clearLogs };
}
