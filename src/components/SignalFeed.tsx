import type { TradeSignal } from "../types";

interface SignalFeedProps {
  signals: TradeSignal[];
}

export function SignalFeed({ signals }: SignalFeedProps) {
  return (
    <div className="border border-terminal-border bg-terminal-panel/60 rounded-lg p-4">
      <h2 className="text-sm font-bold text-terminal-green glow-green tracking-wider mb-3">
        [ SIGNAL_FEED ]
      </h2>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {signals.length === 0 ? (
          <div className="text-xs text-terminal-gray-light">No signals detected. Waiting for market conditions...</div>
        ) : (
          signals.slice().reverse().map((sig, i) => (
            <div key={i} className="flex items-center gap-2 text-xs animate-fade-in">
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                sig.strategy === "rent"
                  ? "bg-terminal-blue/15 text-terminal-blue"
                  : "bg-terminal-yellow/15 text-terminal-yellow"
              }`}>
                {sig.strategy === "rent" ? "RENT" : "RVSL"}
              </span>
              <span className="text-terminal-green font-bold">{sig.action}</span>
              <span className="text-terminal-gray-light">{sig.token}</span>
              <span className="text-terminal-gray-light ml-auto">
                conf: <span className="text-terminal-yellow">{(sig.confidence * 100).toFixed(0)}%</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
