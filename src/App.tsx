import { useBotEngine } from "./useBotEngine";
import { usePhantomWallet } from "./usePhantomWallet";
import { Header } from "./components/Header";
import { ControlPanel } from "./components/ControlPanel";
import { Terminal } from "./components/Terminal";
import { StatsBar } from "./components/StatsBar";
import { SignalFeed } from "./components/SignalFeed";
import { LiveTokenList } from "./components/LiveTokenList";

export default function App() {
  const { wallet, available, connect, disconnect } = usePhantomWallet();

  const { logs, strategies, stats, isRunning, liveSignals, liveTokens, toggleStrategy, toggleBot, clearLogs } =
    useBotEngine(wallet.publicKey, wallet.connected);

  const walletAddress = wallet.publicKey?.toBase58() ?? null;

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-green grid-bg relative">
      <div className="scanline-overlay" />
      <div className="relative z-10 flex flex-col h-screen">
        <Header
          stats={stats}
          isRunning={isRunning}
          walletConnected={wallet.connected}
          walletAddress={walletAddress}
          walletAvailable={available}
          onConnectWallet={connect}
          onDisconnectWallet={disconnect}
        />

        <main className="flex-1 overflow-hidden p-4 space-y-4">
          <StatsBar stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-110px)]">
            <div className="lg:col-span-1 space-y-4 flex flex-col overflow-hidden">
              <ControlPanel
                strategies={strategies}
                isRunning={isRunning}
                onToggleStrategy={toggleStrategy}
                onToggleBot={toggleBot}
              />
              <SignalFeed signals={liveSignals} />
              <LiveTokenList tokens={liveTokens} />
            </div>

            <div className="lg:col-span-2 h-full min-h-[300px]">
              <Terminal logs={logs} onClear={clearLogs} />
            </div>
          </div>
        </main>

        <footer className="border-t border-terminal-border bg-terminal-panel/50 px-6 py-1.5 flex items-center justify-between text-xs text-terminal-gray-light">
          <span>MEOSv1 — Autonomous Solana Trading System</span>
          <span className="hidden sm:inline">
            {wallet.connected ? "Phantom Wallet Connected" : "No Wallet Connected"} | Not financial advice
          </span>
        </footer>
      </div>
    </div>
  );
}
