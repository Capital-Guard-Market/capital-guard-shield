import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

let cachedJwtToken: string | null = null;
let tokenExpiresAt = 0;

function base32tohex(base32: string): string {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let hex = '';
  const clean = base32.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');

  for (let i = 0; i < clean.length; i++) {
    const val = base32chars.indexOf(clean.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    hex += parseInt(bits.substring(i, i + 4), 2).toString(16);
  }
  return hex;
}

function getTOTP(secret: string): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30);
  const timeHex = timeStep.toString(16).padStart(16, '0');

  const key = Buffer.from(base32tohex(secret), 'hex');
  const msg = Buffer.from(timeHex, 'hex');

  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ANGEL_API_KEY;
  const clientCode = process.env.ANGEL_CLIENT_CODE;
  const pin = process.env.ANGEL_PIN;
  const totpSecret = process.env.ANGEL_TOTP_SECRET;

  if (!apiKey || !clientCode || !pin || !totpSecret) {
    return res.status(200).json({
      status: 'FALLBACK_OFFLINE',
      message: 'Environment credentials missing on server.'
    });
  }

  try {
    const now = Date.now();

    if (!cachedJwtToken || now > tokenExpiresAt) {
      const totp = getTOTP(totpSecret);
      const loginRes = await fetch(
        'https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-ClientLocalIP': '192.168.1.1',
            'X-ClientPublicIP': '106.193.147.98',
            'X-MACAddress': 'fe80::216e:6507:4b90:3719',
            'X-PrivateKey': apiKey
          },
          body: JSON.stringify({
            clientcode: clientCode,
            password: pin,
            totp: totp
          })
        }
      );

      const loginData = await loginRes.json();
      if (!loginData.status || !loginData.data?.jwtToken) {
        return res.status(200).json({
          status: 'AUTH_FAILED',
          error: loginData.message || 'SmartAPI authentication failed.'
        });
      }

      cachedJwtToken = loginData.data.jwtToken;
      tokenExpiresAt = now + 10 * 60 * 60 * 1000;
    }

    const quoteRes = await fetch(
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '192.168.1.1',
          'X-ClientPublicIP': '106.193.147.98',
          'X-MACAddress': 'fe80::216e:6507:4b90:3719',
          'X-PrivateKey': apiKey,
          Authorization: `Bearer ${cachedJwtToken}`
        },
        body: JSON.stringify({
          mode: 'FULL',
          exchangeTokens: {
            NSE: ['26000', '26009', '2885', '11536', '1333']
          }
        })
      }
    );

    const quoteData = await quoteRes.json();
    const fetchedList = quoteData.data?.fetched || [];

    const quotes: Record<string, any> = {};
    for (const item of fetchedList) {
      const token = String(item.token || item.symbolToken);
      const ltp = parseFloat(item.ltp || item.lastPrice || 0);

      if (token === '26000') quotes['NIFTY'] = { ltp, change: item.netChange || 0, percentChange: item.percentChange || 0 };
      if (token === '26009') quotes['BANKNIFTY'] = { ltp, change: item.netChange || 0, percentChange: item.percentChange || 0 };
      if (token === '2885') quotes['RELIANCE'] = { ltp, change: item.netChange || 0, percentChange: item.percentChange || 0 };
      if (token === '11536') quotes['TCS'] = { ltp, change: item.netChange || 0, percentChange: item.percentChange || 0 };
      if (token === '1333') quotes['HDFCBANK'] = { ltp, change: item.netChange || 0, percentChange: item.percentChange || 0 };
    }

    return res.status(200).json({
      status: 'LIVE_CONNECTED',
      timestamp: new Date().toLocaleTimeString(),
      quotes
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'SERVER_ERROR',
      error: error.message || 'Internal connection error'
    });
  }
}
