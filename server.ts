import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAINNET_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
];

const DEVNET_ENDPOINTS = [
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet",
];

const PORT = process.env.PORT || 4173;
const distDir = path.join(__dirname, "dist");

const contentTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

async function handleRpc(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  network: "mainnet" | "devnet"
): Promise<boolean> {
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
          lastError = `RPC ${parsed.error.code}: ${parsed.error.message} from ${endpoint}`;
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

  console.error(`[RPC PROXY] All ${network} endpoints failed: ${lastError}`);
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
}

const server = http.createServer(async (req, res) => {
  const reqUrl = req.url || "/";

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, solana-client",
    });
    res.end();
    return;
  }

  // RPC proxy
  const rpcMatch = reqUrl.match(/^\/rpc\/(mainnet|devnet)/);
  if (rpcMatch && req.method === "POST") {
    await handleRpc(req, res, rpcMatch[1] as "mainnet" | "devnet");
    return;
  }

  // Static files
  let filePath = path.join(distDir, reqUrl === "/" ? "/index.html" : reqUrl);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      filePath = path.join(distDir, "index.html");
      fs.readFile(filePath, (err2, data2) => {
        if (err2) {
          res.writeHead(500);
          res.end("Server error");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data2);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  MEOSv1 — Autonomous Solana Trading Bot`);
  console.log(`========================================`);
  console.log(`Dashboard: http://localhost:${PORT}`);
  console.log(`RPC Proxy: /rpc/mainnet, /rpc/devnet`);
  console.log(`Mode: DRY-RUN`);
  console.log(`========================================`);
});
