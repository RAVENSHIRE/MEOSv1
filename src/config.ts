import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const RPC_URL = import.meta.env.VITE_RPC_URL || clusterApiUrl("devnet");

let connection: Connection;

try {
  connection = new Connection(RPC_URL, "confirmed");
} catch {
  connection = new Connection(clusterApiUrl("devnet"), "confirmed");
}

export { connection, RPC_URL };

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export const CONFIG = {
  rpcUrl: RPC_URL,
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
