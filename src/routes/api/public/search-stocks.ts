import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";

const TOP_STOCKS = [
  { id: "NSE_RELIANCE", symbol: "RELIANCE", name: "Reliance Industries Ltd", token: "2885", exchange: "NSE", defaultPrice: 2985.40 },
  { id: "NSE_HDFCBANK", symbol: "HDFCBANK", name: "HDFC Bank Ltd", token: "1333", exchange: "NSE", defaultPrice: 1642.30 },
  { id: "NSE_ICICIBANK", symbol: "ICICIBANK", name: "ICICI Bank Ltd", token: "4963", exchange: "NSE", defaultPrice: 1198.80 },
  { id: "NSE_INFY", symbol: "INFY", name: "Infosys Ltd", token: "1594", exchange: "NSE", defaultPrice: 1845.60 },
  { id: "NSE_TCS", symbol: "TCS", name: "Tata Consultancy Services Ltd", token: "11536", exchange: "NSE", defaultPrice: 4210.00 },
  { id: "NSE_ITC", symbol: "ITC", name: "ITC Ltd", token: "1660", exchange: "NSE", defaultPrice: 485.25 },
  { id: "NSE_LT", symbol: "LT", name: "Larsen & Toubro Ltd", token: "11483", exchange: "NSE", defaultPrice: 3620.00 },
  { id: "NSE_SBIN", symbol: "SBIN", name: "State Bank of India", token: "3045", exchange: "NSE", defaultPrice: 820.75 },
  { id: "NSE_BHARTIARTL", symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", token: "10604", exchange: "NSE", defaultPrice: 1510.50 },
  { id: "NSE_TATAMOTORS", symbol: "TATAMOTORS", name: "Tata Motors Ltd", token: "3456", exchange: "NSE", defaultPrice: 985.60 },
  { id: "NSE_TATASTEEL", symbol: "TATASTEEL", name: "Tata Steel Ltd", token: "3499", exchange: "NSE", defaultPrice: 154.40 },
  { id: "NSE_SUZLON", symbol: "SUZLON", name: "Suzlon Energy Ltd", token: "7172", exchange: "NSE", defaultPrice: 78.50 },
  { id: "BSE_532667", symbol: "SUZLON", name: "Suzlon Energy Ltd", token: "532667", exchange: "BSE", defaultPrice: 78.45 },
  { id: "NSE_IREDA", symbol: "IREDA", name: "Indian Renewable Energy Dev Agency", token: "20875", exchange: "NSE", defaultPrice: 228.40 },
  { id: "NSE_MAZDOCK", symbol: "MAZDOCK", name: "Mazagon Dock Shipbuilders Ltd", token: "2142", exchange: "NSE", defaultPrice: 4320.00 },
  { id: "NSE_ZOMATO", symbol: "ZOMATO", name: "Zomato Ltd", token: "5097", exchange: "NSE", defaultPrice: 254.80 },
  { id: "NSE_JIOFIN", symbol: "JIOFIN", name: "Jio Financial Services Ltd", token: "18143", exchange: "NSE", defaultPrice: 332.40 },
  { id: "NSE_TRENT", symbol: "TRENT", name: "Trent Ltd", token: "1964", exchange: "NSE", defaultPrice: 6890.00 },
  { id: "NSE_BEL", symbol: "BEL", name: "Bharat Electronics Ltd", token: "383", exchange: "NSE", defaultPrice: 298.50 },
  { id: "NSE_HAL", symbol: "HAL", name: "Hindustan Aeronautics Ltd", token: "2303", exchange: "NSE", defaultPrice: 4720.00 },
  { id: "BSE_500325", symbol: "RELIANCE", name: "Reliance Industries Ltd", token: "500325", exchange: "BSE", defaultPrice: 2984.90 },
  { id: "BSE_500180", symbol: "HDFCBANK", name: "HDFC Bank Ltd", token: "500180", exchange: "BSE", defaultPrice: 1642.00 },
  { id: "BSE_532540", symbol: "TCS", name: "Tata Consultancy Services Ltd", token: "532540", exchange: "BSE", defaultPrice: 4210.00 },
];

export const Route = createAPIFileRoute("/api/public/search-stocks")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();
    const exchangeFilter = url.searchParams.get("exchange") || "ALL";

    if (!query) {
      return json({ results: TOP_STOCKS.slice(0, 10) });
    }

    const filtered = TOP_STOCKS.filter((s) => {
      const matchExch = exchangeFilter === "ALL" || s.exchange === exchangeFilter;
      const matchQuery =
        s.symbol.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query);
      return matchExch && matchQuery;
    });

    return json({ results: filtered });
  },
});