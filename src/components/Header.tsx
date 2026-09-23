import type { BotStats } from "../types";
import { CONFIG, getShortAddress } from "../config";

interface HeaderProps {
  stats: BotStats;
  isRunning: boolean;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Header({ stats, isRunning }: HeaderProps) {
  return (
    <header className="border-b border-terminal-border bg-terminal-panel/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-terminal-green animate-pulse" : "bg-terminal-gray"}`} />
            <h1 className="text-terminal-green glow-green text-lg font-bold tracking-wider">
              MEOS<span className="text-terminal-gray-light">v1</span>
            </h1>
          </div>
          <span className="text-xs text-terminal-gray-light hidden sm:inline">
            Autonomous Solana Trading Bot
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stats.rpcConnected ? "bg-terminal-green animate-pulse" : "bg-terminal-red"}`} />
            <span className="text-terminal-gray-light">RPC</span>
            <span className={stats.rpcConnected ? "text-terminal-green" : "text-terminal-red"}>
              {stats.rpcConnected ? `ONLINE ${stats.rpcLatency}ms` : "OFFLINE"}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-terminal-gray-light">SLOT</span>
            <span className="text-terminal-blue glow-blue">{stats.currentSlot.toLocaleString()}</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-terminal-gray-light">TPS</span>
            <span className="text-terminal-blue">{stats.tps.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-terminal-gray-light">WALLET</span>
            <span className="text-terminal-yellow glow-yellow font-mono">{getShortAddress()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-terminal-gray-light">BAL</span>
            <span className="text-terminal-green glow-green">{stats.solBalance.toFixed(4)} SOL</span>
          </div>

          <div className={`px-2 py-0.5 rounded text-xs font-bold ${CONFIG.isDryRun ? "bg-terminal-yellow/10 text-terminal-yellow border border-terminal-yellow/30" : "bg-terminal-red/10 text-terminal-red border border-terminal-red/30"}`}>
            {CONFIG.isDryRun ? "DRY-RUN" : "LIVE"}
          </div>

          {isRunning && (
            <div className="flex items-center gap-2">
              <span className="text-terminal-gray-light">UP</span>
              <span className="text-terminal-green">{formatUptime(stats.uptime)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
