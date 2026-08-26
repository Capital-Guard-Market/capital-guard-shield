import { createFileRoute } from "@tanstack/react-router";

const TOKENS: Record<string, string> = {
  "99926000": "NIFTY",
  "99926009": "BANKNIFTY",
  "2885": "RELIANCE",
  "11536": "TCS",
  "1333": "HDFCBANK",
};

/** Decode a Base32 (RFC 4648) secret into raw bytes — no external packages. */
function base32ToBytes(secret: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = secret.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = "";
  for (const ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

/** RFC 6238 TOTP (SHA-1, 30s step, 6 digits) using Web Crypto. */
async function getTotp(secret: string): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / 30);
  const msg = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    base32ToBytes(secret) as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg as unknown as ArrayBuffer));
  const offset = sig[sig.length - 1]! & 0x0f;
  const code =
    (((sig[offset]! & 0x7f) << 24) |
      ((sig[offset + 1]! & 0xff) << 16) |
      ((sig[offset + 2]! & 0xff) << 8) |
      (sig[offset + 3]! & 0xff)) %
    1000000;
  return code.toString().padStart(6, "0");
}

function angelHeaders(apiKey: string, jwt?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": "192.168.1.1",
    "X-ClientPublicIP": "106.193.147.98",
    "X-MACAddress": "fe80::216e:6507:4b90:3719",
    "X-PrivateKey": apiKey,
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
  return headers;
}

export const Route = createFileRoute("/api/public/market-feed")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env["ANGEL_API_KEY"];
        const clientCode = process.env["ANGEL_CLIENT_CODE"];
        const pin = process.env["ANGEL_PIN"];
        const totpSecret = process.env["ANGEL_TOTP_SECRET"];

        const noStore = { "cache-control": "no-store" };

        if (!apiKey || !clientCode || !pin || !totpSecret) {
          return Response.json(
            {
              status: "FALLBACK_OFFLINE",
              message: "Angel One credentials are not configured.",
              quotes: [],
            },
            { headers: noStore },
          );
        }

        try {
          const totp = await getTotp(totpSecret);

          const loginRes = await fetch(
            "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
            {
              method: "POST",
              headers: angelHeaders(apiKey),
              body: JSON.stringify({ clientcode: clientCode, password: pin, totp }),
            },
          );
          const loginData = (await loginRes.json()) as {
            status?: boolean;
            message?: string;
            data?: { jwtToken?: string };
          };

          const jwt = loginData.data?.jwtToken;
          if (!jwt) {
            return Response.json(
              {
                status: "AUTH_FAILED",
                message: loginData.message || "SmartAPI authentication failed.",
                quotes: [],
              },
              { headers: noStore },
            );
          }

          const quoteRes = await fetch(
            "https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote",
            {
              method: "POST",
              headers: angelHeaders(apiKey, jwt),
              body: JSON.stringify({
                mode: "FULL",
                exchangeTokens: { NSE: Object.keys(TOKENS) },
              }),
            },
          );
          const quoteData = (await quoteRes.json()) as {
            data?: { fetched?: Array<Record<string, unknown>> };
            message?: string;
          };

          const fetched = quoteData.data?.fetched ?? [];
          const quotes = fetched.map((q) => {
            const token = String(q["symbolToken"] ?? "");
            return {
              symbol: TOKENS[token] ?? String(q["tradingSymbol"] ?? token),
              ltp: Number(q["ltp"] ?? 0),
              change: Number(q["netChange"] ?? 0),
              changePercent: Number(q["percentChange"] ?? 0),
              open: Number(q["open"] ?? 0),
              high: Number(q["high"] ?? 0),
              low: Number(q["low"] ?? 0),
              close: Number(q["close"] ?? 0),
            };
          });

          return Response.json(
            {
              status: quotes.length ? "LIVE_CONNECTED" : "NO_DATA",
              timestamp: new Date().toISOString(),
              quotes,
            },
            { headers: noStore },
          );
        } catch (error) {
          console.error("market-feed error", error);
          return Response.json(
            { status: "SERVER_ERROR", message: "Market feed unavailable.", quotes: [] },
            { status: 502, headers: noStore },
          );
        }
      },
    },
  },
});
