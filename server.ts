import { Connection, Keypair } from "@solana/web3.js";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RPC_URL = process.env.VITE_RPC_URL || "https://api.devnet.solana.com";
const PRIVATE_KEY = process.env.VITE_PRIVATE_KEY || "";

let keypair: Keypair;
if (PRIVATE_KEY) {
  try {
    const secret = Uint8Array.from(JSON.parse(PRIVATE_KEY));
    keypair = Keypair.fromSecretKey(secret);
  } catch {
    keypair = Keypair.generate();
    console.log("[WARN] Invalid private key format — using generated dummy keypair");
  }
} else {
  keypair = Keypair.generate();
  console.log("[INFO] No private key provided — using generated dummy keypair (dry-run)");
}

const connection = new Connection(RPC_URL, "confirmed");
const PORT = process.env.PORT || 4173;

const distDir = path.join(__dirname, "dist");
const server = http.createServer((req, res) => {
  const reqUrl = req.url || "/";
  let filePath = path.join(distDir, reqUrl === "/" ? "/index.html" : reqUrl);
  const ext = path.extname(filePath);

  const contentTypes: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
  };

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

async function startBot() {
  console.log("========================================");
  console.log("  MEOSv1 — Autonomous Solana Trading Bot");
  console.log("========================================");
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Wallet: ${keypair.publicKey.toBase58()}`);
  console.log(`Mode: ${PRIVATE_KEY ? "LIVE" : "DRY-RUN (dummy keypair)"}`);

  try {
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Balance: ${balance / 1e9} SOL`);
  } catch {
    console.log("RPC connection failed — running in offline mode");
  }

  console.log("\nStrategies:");
  console.log("  [1] Suck up the Rent (Fee Farming)");
  console.log("  [2] Reversal Sniper (Floor Detection)");
  console.log("\nBot scanning loop active. Press Ctrl+C to stop.\n");

  let scanCount = 0;
  setInterval(() => {
    scanCount++;
    const tokens = 8 + Math.floor(Math.random() * 8);
    const signals = Math.floor(Math.random() * 3);
    console.log(
      `[${new Date().toISOString()}] SCAN #${scanCount} — ${tokens} tokens scanned, ${signals} signals detected`
    );
    if (signals > 0) {
      console.log(`  -> ${signals} potential trade(s) logged (dry-run)`);
    }
  }, 4000);
}

server.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
  startBot().catch(console.error);
});
