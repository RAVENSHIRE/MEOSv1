import { Connection, PublicKey } from "@solana/web3.js";

export type Network = "mainnet" | "devnet";

// Both the Vite dev server and the production server.ts proxy /rpc/<network>
// to the real Solana RPC, stripping browser headers that trigger 403 blocks.
// rpcClient.ts uses the relative path directly with fetch(). createConnection()
// needs an absolute URL because @solana/web3.js validates the scheme, so we
// expand it against the current origin only when window is available.
const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

export const RPC_ENDPOINTS: Record<Network, string> = {
  mainnet: "/rpc/mainnet",
  devnet: "/rpc/devnet",
};

export function connectionUrl(network: Network): string {
  return `${ORIGIN}${RPC_ENDPOINTS[network]}`;
}

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export function createConnection(network: Network): Connection {
  return new Connection(connectionUrl(network), "confirmed");
}

export const CONFIG = {
  isDryRun: true,
  scanIntervalMs: 5000,
  strategies: {
    rent: {
      label: "Suck up the Rent",
      description: "Delta-neutral fee farming on extreme volume spikes",
      minVolumeSpike: 3.0,
      minLiquidityUsd: 50000,
      feeBps: 25,
    },
    reversal: {
      label: "Reversal Sniper",
      description: "Token floor detection with wash-trade filtering",
      minPriceDropPct: 15,
      minLiquidityUsd: 30000,
      washTradeThreshold: 0.65,
    },
  },
};

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}
