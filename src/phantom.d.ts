import type { PublicKey } from "@solana/web3.js";

export interface PhantomProvider {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (args?: unknown) => void) => void;
  removeListener: (event: string, handler: (args?: unknown) => void) => void;
  signTransaction: <T>(tx: T) => Promise<T>;
  signAllTransactions: <T>(txs: T[]) => Promise<T[]>;
  signMessage: (message: Uint8Array, display: "utf8" | "hex") => Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider & { isPhantom?: boolean };
  }
}

export {};
