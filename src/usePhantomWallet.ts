import { useEffect, useState, useCallback } from "react";
import type { PublicKey } from "@solana/web3.js";
import type { PhantomProvider } from "./phantom";

type WalletState = {
  connected: boolean;
  publicKey: PublicKey | null;
  provider: PhantomProvider | null;
};

export function usePhantomWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    provider: null,
  });
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    function getProvider(): PhantomProvider | null {
      if (typeof window === "undefined") return null;
      const provider = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null);
      return provider ?? null;
    }

    const provider = getProvider();
    if (!provider) {
      setAvailable(false);
      return;
    }

    setAvailable(true);

    function handleConnect(args: unknown) {
      const pubKey = (args as { publicKey: PublicKey })?.publicKey;
      if (mounted && pubKey) {
        setWallet({ connected: true, publicKey: pubKey, provider });
      }
    }

    function handleDisconnect() {
      if (mounted) {
        setWallet({ connected: false, publicKey: null, provider });
      }
    }

    function handleAccountChanged(args: unknown) {
      const pubKey = (args as { publicKey: PublicKey | null })?.publicKey ?? null;
      if (mounted) {
        if (pubKey) {
          setWallet({ connected: true, publicKey: pubKey, provider });
        } else {
          setWallet({ connected: false, publicKey: null, provider });
        }
      }
    }

    provider.on("connect", handleConnect);
    provider.on("disconnect", handleDisconnect);
    provider.on("accountChanged", handleAccountChanged);

    // Try eager connect (only if already trusted)
    provider
      .connect({ onlyIfTrusted: true })
      .then((res) => {
        if (mounted) {
          setWallet({ connected: true, publicKey: res.publicKey, provider });
        }
      })
      .catch(() => {
        // Not previously trusted — user must click connect
      });

    return () => {
      mounted = false;
      provider.removeListener("connect", handleConnect);
      provider.removeListener("disconnect", handleDisconnect);
      provider.removeListener("accountChanged", handleAccountChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const provider = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null);
    if (!provider) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    try {
      const res = await provider.connect();
      setWallet({ connected: true, publicKey: res.publicKey, provider });
    } catch {
      // user rejected
    }
  }, []);

  const disconnect = useCallback(async () => {
    const provider = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null);
    if (!provider) return;
    try {
      await provider.disconnect();
    } catch {
      // ignore
    }
    setWallet({ connected: false, publicKey: null, provider });
  }, []);

  return { wallet, available, connect, disconnect };
}
