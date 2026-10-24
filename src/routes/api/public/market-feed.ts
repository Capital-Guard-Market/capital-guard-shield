import { createFileRoute } from "@tanstack/react-router";

const TOKENS: Record<string, string> = {
  "99926000": "NIFTY",
  "99926009": "BANKNIFTY",
  "2885": "RELIANCE",
  "11536": "TCS",
  "1333": "HDFCBANK",
};

const AUTH_TTL_MS = 20 * 60 * 1000;
const QUOTE_CACHE_MS = 1_500;

type AngelSession = { jwt: string; expiresAt: number };
type Quote = {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

let angelSession: AngelSession | undefined;
let loginPromise: Promise<string> | undefined;
let quotePromise: Promise<Quote[]> | undefined;
let quoteCache: { quotes: Quote[]; timestamp: string; expiresAt: number } | undefined;

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
  const lastByte = sig.at(-1);
  if (lastByte === undefined) throw new Error("Unable to generate TOTP.");
  const offset = lastByte & 0x0f;
  const byte0 = sig[offset];
  const byte1 = sig[offset + 1];
  const byte2 = sig[offset + 2];
  const byte3 = sig[offset + 3];
  if (byte0 === undefined || byte1 === undefined || byte2 === undefined || byte3 === undefined) {
    throw new Error("Invalid TOTP signature.");
  }
  const code =
    (((byte0 & 0x7f) << 24) |
      ((byte1 & 0xff) << 16) |
      ((byte2 & 0xff) << 8) |
      (byte3 & 0xff)) %
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

async function readAngelJson<T>(response: Response, operation: string): Promise<T> {
  const body = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch {
    const detail = body.trim().slice(0, 200) || "empty response";
    throw new Error(`Angel One ${operation} returned ${response.status}: ${detail}`);
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String(payload.message)
        : response.statusText;
    throw new Error(`Angel One ${operation} failed (${response.status}): ${message}`);
  }

  return payload as T;
}

async function login(apiKey: string, clientCode: string, pin: string, totpSecret: string) {
  if (angelSession && angelSession.expiresAt > Date.now()) return angelSession.jwt;
  if (loginPromise) return loginPromise;

  loginPromise = (async () => {
    const totp = await getTotp(totpSecret);
    const response = await fetch(
      "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
      {
        method: "POST",
        headers: angelHeaders(apiKey),
        body: JSON.stringify({ clientcode: clientCode, password: pin, totp }),
      },
    );
    const data = await readAngelJson<{
      status?: boolean;
      message?: string;
      data?: { jwtToken?: string };
    }>(response, "login");
    const jwt = data.data?.jwtToken;
    if (!data.status || !jwt) throw new Error(data.message || "SmartAPI authentication failed.");
    angelSession = { jwt, expiresAt: Date.now() + AUTH_TTL_MS };
    return jwt;
  })().finally(() => {
    loginPromise = undefined;
  });

  return loginPromise;
}

async function fetchQuotes(
  apiKey: string,
  jwt: string,
  exchangeTokens: Record<string, string[]> = { NSE: Object.keys(TOKENS) },
): Promise<Quote[]> {
  const response = await fetch(
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote",
    {
      method: "POST",
      headers: angelHeaders(apiKey, jwt),
      body: JSON.stringify({ mode: "FULL", exchangeTokens }),
    },
  );
  const data = await readAngelJson<{
    status?: boolean;
    data?: { fetched?: Array<Record<string, unknown>> };
    message?: string;
  }>(response, "quote request");
  if (data.status === false) throw new Error(data.message || "SmartAPI quote request failed.");

  return (data.data?.fetched ?? []).map((quote) => {
    const token = String(quote["symbolToken"] ?? "");
    return {
      symbol: TOKENS[token] ?? String(quote["tradingSymbol"] ?? token),
      ltp: Number(quote["ltp"] ?? 0),
      change: Number(quote["netChange"] ?? 0),
      changePercent: Number(quote["percentChange"] ?? 0),
      open: Number(quote["open"] ?? 0),
      high: Number(quote["high"] ?? 0),
      low: Number(quote["low"] ?? 0),
      close: Number(quote["close"] ?? 0),
    };
  });
}

export const Route = createFileRoute("/api/public/market-feed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const exchange = url.searchParams.get("exchange");
        const token = url.searchParams.get("token");
        const isInstrumentQuote = exchange !== null || token !== null;
        if (
          isInstrumentQuote &&
          ((!exchange || !token) || (exchange !== "NSE" && exchange !== "BSE") || !/^\d+$/.test(token))
        ) {
          return Response.json(
            { status: "INVALID_REQUEST", message: "Provide a valid NSE/BSE exchange and numeric token." },
            { status: 400, headers: { "cache-control": "no-store" } },
          );
        }

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
          if (isInstrumentQuote && exchange && token) {
            const fetchInstrumentQuote = async () => {
              const jwt = await login(apiKey, clientCode, pin, totpSecret);
              try {
                return await fetchQuotes(apiKey, jwt, { [exchange]: [token] });
              } catch (error) {
                if (!(error instanceof Error) || !/401|unauthor|token|session/i.test(error.message)) {
                  throw error;
                }
                angelSession = undefined;
                return fetchQuotes(apiKey, await login(apiKey, clientCode, pin, totpSecret), {
                  [exchange]: [token],
                });
              }
            };
            const quote = (await fetchInstrumentQuote())[0] ?? null;
            return Response.json(
              {
                status: quote ? "LIVE_CONNECTED" : "NO_DATA",
                timestamp: new Date().toISOString(),
                quote,
              },
              { headers: { "cache-control": "no-store" } },
            );
          }

          if (quoteCache && quoteCache.expiresAt > Date.now()) {
            return Response.json(
              { status: "LIVE_CONNECTED", timestamp: quoteCache.timestamp, quotes: quoteCache.quotes },
              { headers: noStore },
            );
          }

          if (!quotePromise) {
            quotePromise = (async () => {
              const jwt = await login(apiKey, clientCode, pin, totpSecret);
              try {
                return await fetchQuotes(apiKey, jwt);
              } catch (error) {
                if (!(error instanceof Error) || !/401|unauthor|token|session/i.test(error.message)) {
                  throw error;
                }
                angelSession = undefined;
                return fetchQuotes(apiKey, await login(apiKey, clientCode, pin, totpSecret));
              }
            })().finally(() => {
              quotePromise = undefined;
            });
          }

          const quotes = await quotePromise;
          const timestamp = new Date().toISOString();
          if (quotes.length) {
            quoteCache = { quotes, timestamp, expiresAt: Date.now() + QUOTE_CACHE_MS };
          }

          return Response.json(
            {
              status: quotes.length ? "LIVE_CONNECTED" : "NO_DATA",
              timestamp,
              quotes,
            },
            { headers: noStore },
          );
        } catch (error) {
          console.error("market-feed error", error);
          return Response.json(
            { status: "SERVER_ERROR", message: "Market feed unavailable.", quotes: [] },
            { headers: noStore },
          );
        }
      },
    },
  },
});
