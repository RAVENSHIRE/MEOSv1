import { Connection, PublicKey } from "@solana/web3.js";

export type Network = "mainnet" | "devnet";

// Both the Vite dev server and the production server.ts proxy /rpc/<network>
// to the real Solana RPC, stripping browser headers that trigger 403 blocks.
export const RPC_ENDPOINTS: Record<Network, string> = {
  mainnet: "/rpc/mainnet",
  devnet: "/rpc/devnet",
};

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export function createConnection(network: Network): Connection {
  const url = RPC_ENDPOINTS[network];
  return new Connection(url, "confirmed");
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
