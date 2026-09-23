import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";

const RPC_URL = import.meta.env.VITE_RPC_URL || clusterApiUrl("devnet");
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || "";

export const IS_DRY_RUN = !PRIVATE_KEY;

let keypair: Keypair;
let connection: Connection;

try {
  if (PRIVATE_KEY) {
    const secret = Uint8Array.from(JSON.parse(PRIVATE_KEY));
    keypair = Keypair.fromSecretKey(secret);
  } else {
    keypair = Keypair.generate();
  }
  connection = new Connection(RPC_URL, "confirmed");
} catch {
  keypair = Keypair.generate();
  connection = new Connection(clusterApiUrl("devnet"), "confirmed");
}

export { keypair, connection, RPC_URL };

export const CONFIG = {
  rpcUrl: RPC_URL,
  walletAddress: keypair.publicKey.toBase58(),
  isDryRun: IS_DRY_RUN,
  scanIntervalMs: 4000,
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

export function getShortAddress(): string {
  const addr = CONFIG.walletAddress;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}
