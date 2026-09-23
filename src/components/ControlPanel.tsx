import type { StrategyConfig } from "../types";

interface ControlPanelProps {
  strategies: StrategyConfig[];
  isRunning: boolean;
  onToggleStrategy: (name: string) => void;
  onToggleBot: () => void;
}

export function ControlPanel({ strategies, isRunning, onToggleStrategy, onToggleBot }: ControlPanelProps) {
  return (
    <div className="border border-terminal-border bg-terminal-panel/60 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-terminal-green glow-green tracking-wider">
          [ CONTROL_PANEL ]
        </h2>
        <button
          onClick={onToggleBot}
          className={`px-4 py-1.5 rounded text-xs font-bold tracking-wider transition-all border ${
            isRunning
              ? "bg-terminal-red/10 text-terminal-red border-terminal-red/40 hover:bg-terminal-red/20 glow-red"
              : "bg-terminal-green/10 text-terminal-green border-terminal-green/40 hover:bg-terminal-green/20 glow-green"
          }`}
        >
          {isRunning ? "■ STOP BOT" : "▶ START BOT"}
        </button>
      </div>

      <div className="space-y-3">
        {strategies.map((strat) => (
          <div
            key={strat.name}
            className={`border rounded-lg p-3 transition-all ${
              strat.enabled
                ? "border-terminal-green/40 bg-terminal-green/5"
                : "border-terminal-border bg-terminal-bg/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${strat.enabled ? "text-terminal-green" : "text-terminal-gray-light"}`}>
                    {strat.label}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    strat.enabled
                      ? "bg-terminal-green/15 text-terminal-green"
                      : "bg-terminal-gray/15 text-terminal-gray-light"
                  }`}>
                    {strat.state.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-terminal-gray-light mt-0.5">{strat.description}</p>
              </div>

              <button
                onClick={() => onToggleStrategy(strat.name)}
                className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ml-3 ${
                  strat.enabled ? "bg-terminal-green/30" : "bg-terminal-gray/20"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                    strat.enabled
                      ? "left-6 bg-terminal-green shadow-[0_0_8px_rgba(0,255,159,0.5)]"
                      : "left-0.5 bg-terminal-gray-light"
                  }`}
                />
              </button>
            </div>

            {strat.enabled && (
              <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-terminal-border/50 text-xs animate-fade-in">
                <div>
                  <span className="text-terminal-gray-light">Trades: </span>
                  <span className="text-terminal-blue">{strat.trades}</span>
                </div>
                <div>
                  <span className="text-terminal-gray-light">PnL: </span>
                  <span className={strat.pnl >= 0 ? "text-terminal-green" : "text-terminal-red"}>
                    {strat.pnl >= 0 ? "+" : ""}{strat.pnl.toFixed(4)} SOL
                  </span>
                </div>
                <div>
                  <span className="text-terminal-gray-light">Win: </span>
                  <span className="text-terminal-yellow">{(strat.winRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
