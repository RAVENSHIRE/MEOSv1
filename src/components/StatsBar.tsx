import type { BotStats } from "../types";

interface StatsBarProps {
  stats: BotStats;
}

function StatCard({ label, value, color, glow }: { label: string; value: string; color: string; glow?: string }) {
  return (
    <div className="border border-terminal-border bg-terminal-panel/50 rounded-lg px-4 py-2.5">
      <div className="text-xs text-terminal-gray-light uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold ${color} ${glow || ""}`}>{value}</div>
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatCard label="Total Scans" value={stats.totalScans.toLocaleString()} color="text-terminal-blue" glow="glow-blue" />
      <StatCard label="Total Trades" value={stats.totalTrades.toLocaleString()} color="text-terminal-green" glow="glow-green" />
      <StatCard
        label="Total PnL"
        value={`${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(4)} SOL`}
        color={stats.totalPnl >= 0 ? "text-terminal-green" : "text-terminal-red"}
        glow={stats.totalPnl >= 0 ? "glow-green" : "glow-red"}
      />
      <StatCard label="Wallet Balance" value={`${stats.solBalance.toFixed(4)} SOL`} color="text-terminal-yellow" glow="glow-yellow" />
      <StatCard label="Token Accounts" value={stats.tokenCount.toLocaleString()} color="text-terminal-blue" />
    </div>
  );
}
