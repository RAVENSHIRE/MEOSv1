import type { Network } from "./config";
import { RPC_ENDPOINTS } from "./config";

interface RpcResponse<T> {
  jsonrpc: string;
  id: number | string;
  result?: T;
  error?: { code: number; message: string };
}

let reqId = 0;

export async function rpcCall<T>(
  network: Network,
  method: string,
  params: unknown[],
  timeoutMs = 10000
): Promise<T> {
  const endpoint = RPC_ENDPOINTS[network];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++reqId,
        method,
        params,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    const data: RpcResponse<T> = await resp.json();

    if (data.error) {
      throw new Error(`RPC ${data.error.code}: ${data.error.message}`);
    }

    if (data.result === undefined) {
      throw new Error("RPC returned empty result");
    }

    return data.result;
  } finally {
    clearTimeout(timeout);
  }
}

export interface BalanceResult {
  context: { slot: number; apiVersion: string };
  value: number;
}

export async function getBalance(network: Network, address: string): Promise<number> {
  const result = await rpcCall<BalanceResult>(network, "getBalance", [address]);
  return result.value;
}

export interface TokenAccount {
  pubkey: string;
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: { amount: string; decimals: number; uiAmount: number | null };
        };
      };
    };
  };
}

export interface TokenAccountsResult {
  context: { slot: number };
  value: TokenAccount[];
}

export async function getTokenAccounts(
  network: Network,
  address: string,
  programId: string
): Promise<TokenAccount[]> {
  const result = await rpcCall<TokenAccountsResult>(
    network,
    "getTokenAccountsByOwner",
    [address, { programId }, { encoding: "jsonParsed" }]
  );
  return result.value;
}

export async function getSlot(network: Network): Promise<number> {
  return rpcCall<number>(network, "getSlot", []);
}
