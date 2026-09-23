interface LiveTokenInfo {
  symbol: string;
  price: number;
  volume24h: number;
  priceChange1h: number;
}

interface LiveTokenListProps {
  tokens: LiveTokenInfo[];
}

export function LiveTokenList({ tokens }: LiveTokenListProps) {
  return (
    <div className="border border-terminal-border bg-terminal-panel/60 rounded-lg p-4">
      <h2 className="text-sm font-bold text-terminal-green glow-green tracking-wider mb-3">
        [ LIVE_TOKEN_FEED ]
      </h2>
      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {tokens.length === 0 ? (
          <div className="text-xs text-terminal-gray-light">
            No live tokens loaded. Start the bot to fetch from RPC...
          </div>
        ) : (
          tokens.map((token, i) => (
            <div key={i} className="flex items-center gap-2 text-xs animate-fade-in">
              <span className="text-terminal-yellow font-bold w-12">{token.symbol}</span>
              <span className="text-terminal-gray-light">
                ${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(4)}
              </span>
              <span className="text-terminal-gray-light ml-auto">
                Vol: <span className="text-terminal-blue">${(token.volume24h / 1000).toFixed(1)}k</span>
              </span>
              <span className={token.priceChange1h >= 0 ? "text-terminal-green" : "text-terminal-red"}>
                {token.priceChange1h >= 0 ? "+" : ""}{token.priceChange1h.toFixed(1)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
