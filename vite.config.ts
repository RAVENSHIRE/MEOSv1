import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";

const MAINNET_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

const DEVNET_ENDPOINTS = [
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet",
];

function solanaRpcProxy(): PluginOption {
  const handler = async (req: any, res: any): Promise<boolean> => {
    const url: string = req.url || "";

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, solana-client",
      });
      res.end();
      return true;
    }

    const match = url.match(/^\/rpc\/(mainnet|devnet)/);
    if (!match) return false;

    const network = match[1] as "mainnet" | "devnet";
    const endpoints = network === "mainnet" ? MAINNET_ENDPOINTS : DEVNET_ENDPOINTS;

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString("utf-8");

    let lastError = "";
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        // Clean request: only Content-Type, no Origin/Referer/browser headers
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!resp.ok) {
          lastError = `HTTP ${resp.status} from ${endpoint}`;
          continue;
        }

        const data = await resp.text();
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            lastError = `RPC error ${parsed.error.code}: ${parsed.error.message} from ${endpoint}`;
            continue;
          }
        } catch {
          lastError = `Invalid JSON from ${endpoint}`;
          continue;
        }

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(data);
        return true;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }

    res.writeHead(502, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32603, message: `All ${network} RPC endpoints failed: ${lastError}` },
      id: null,
    }));
    return true;
  };

  return {
    name: "solana-rpc-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handler(req, res);
        if (!handled) next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handler(req, res);
        if (!handled) next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), solanaRpcProxy()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: { overlay: false },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ["@solana/web3.js", "eventemitter3"],
  },
});
