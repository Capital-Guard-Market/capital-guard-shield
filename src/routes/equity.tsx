import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  loadEquityPortfolio,
  saveEquityPortfolio,
  EquityPortfolioState,
  EquityHolding,
} from "../lib/equityStore";
import {
  Search,
  LineChart,
  Wallet,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/equity")({
  component: EquityInvestmentsComponent,
});

interface ActiveStock {
  id: string;
  symbol: string;
  name: string;
  token: string;
  exchange: "NSE" | "BSE";
  price: number;
  dayChangePct: number;
}

const DEFAULT_ACTIVE_STOCK: ActiveStock = {
  id: "NSE_2885",
  symbol: "RELIANCE",
  name: "Reliance Industries Ltd",
  token: "2885",
  exchange: "NSE",
  price: 2985.40,
  dayChangePct: 1.15,
};

export function EquityInvestmentsComponent() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<EquityPortfolioState>(loadEquityPortfolio());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [exchangeFilter, setExchangeFilter] = useState<"ALL" | "NSE" | "BSE">("ALL");
  const [searchResults, setSearchResults] = useState<ActiveStock[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Selected Stock & Order Ticket State
  const [selectedStock, setSelectedStock] = useState<ActiveStock>(DEFAULT_ACTIVE_STOCK);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [sharesQty, setSharesQty] = useState<number>(10);
  const [notification, setNotification] = useState<string | null>(null);

  // Debounced API Search for All NSE/BSE Stocks
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/public/search-stocks?q=${encodeURIComponent(searchQuery)}&exchange=${exchangeFilter}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(
            (data.results || []).map((s: any) => ({
              ...s,
              price: s.defaultPrice || 150.0,
              dayChangePct: +(Math.random() * 3 - 1.2).toFixed(2),
            }))
          );
        }
      } catch (err) {
        console.error("Failed to query stock catalog:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, exchangeFilter]);

  // Aggregate Portfolio Math
  const totalInvested = useMemo(() => {
    return portfolio.holdings.reduce((acc, h) => acc + h.totalInvested, 0);
  }, [portfolio.holdings]);

  const currentMarketValue = useMemo(() => {
    return portfolio.holdings.reduce((acc, h) => acc + h.qty * h.currentPrice, 0);
  }, [portfolio.holdings]);

  const totalUnrealizedPnL = currentMarketValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
  const totalPortfolioWealth = portfolio.availableCash + currentMarketValue;

  // Order Calculations
  const totalOrderAmount = sharesQty * selectedStock.price;
  const existingHolding = portfolio.holdings.find(
    (h) => h.symbol === selectedStock.symbol
  );
  const canBuy = portfolio.availableCash >= totalOrderAmount;
  const canSell = existingHolding && existingHolding.qty >= sharesQty;

  const handleSelectStock = (stock: ActiveStock) => {
    setSelectedStock(stock);
    setSearchQuery("");
  };

  const handleExecuteCNCOrder = () => {
    if (orderSide === "BUY") {
      if (!canBuy) return;

      let updatedHoldings: EquityHolding[];
      if (existingHolding) {
        const newQty = existingHolding.qty + sharesQty;
        const newInvested = existingHolding.totalInvested + totalOrderAmount;
        const newAvg = newInvested / newQty;
        const newCurVal = newQty * selectedStock.price;

        updatedHoldings = portfolio.holdings.map((h) =>
          h.symbol === selectedStock.symbol
            ? {
                ...h,
                qty: newQty,
                avgBuyPrice: newAvg,
                totalInvested: newInvested,
                currentPrice: selectedStock.price,
                currentValue: newCurVal,
                unrealizedPnL: newCurVal - newInvested,
                unrealizedPnLPct: ((newCurVal - newInvested) / newInvested) * 100,
              }
            : h
        );
      } else {
        const newCurVal = sharesQty * selectedStock.price;
        const newHolding: EquityHolding = {
          id: `HOLD-${selectedStock.exchange}_${selectedStock.symbol}`,
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          qty: sharesQty,
          avgBuyPrice: selectedStock.price,
          currentPrice: selectedStock.price,
          totalInvested: totalOrderAmount,
          currentValue: newCurVal,
          unrealizedPnL: 0,
          unrealizedPnLPct: 0,
          sector: selectedStock.exchange,
        };
        updatedHoldings = [newHolding, ...portfolio.holdings];
      }

      const updatedState: EquityPortfolioState = {
        availableCash: portfolio.availableCash - totalOrderAmount,
        holdings: updatedHoldings,
      };

      saveEquityPortfolio(updatedState);
      setPortfolio(updatedState);
      setNotification(`Bought ${sharesQty} shares of ${selectedStock.symbol} on ${selectedStock.exchange} (CNC Delivery)`);
      setTimeout(() => setNotification(null), 3500);
    } else {
      if (!canSell || !existingHolding) return;

      let updatedHoldings: EquityHolding[];
      if (existingHolding.qty === sharesQty) {
        updatedHoldings = portfolio.holdings.filter((h) => h.symbol !== selectedStock.symbol);
      } else {
        const remainingQty = existingHolding.qty - sharesQty;
        const remainingInvested = remainingQty * existingHolding.avgBuyPrice;
        const curVal = remainingQty * selectedStock.price;

        updatedHoldings = portfolio.holdings.map((h) =>
          h.symbol === selectedStock.symbol
            ? {
                ...h,
                qty: remainingQty,
                totalInvested: remainingInvested,
                currentValue: curVal,
                unrealizedPnL: curVal - remainingInvested,
                unrealizedPnLPct: ((curVal - remainingInvested) / remainingInvested) * 100,
              }
            : h
        );
      }

      const updatedState: EquityPortfolioState = {
        availableCash: portfolio.availableCash + totalOrderAmount,
        holdings: updatedHoldings,
      };

      saveEquityPortfolio(updatedState);
      setPortfolio(updatedState);
      setNotification(`Sold ${sharesQty} shares of ${selectedStock.symbol} on ${selectedStock.exchange} (CNC Delivery)`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Banner HUD */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#151a23] border border-[#22283a] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <LineChart className="w-4 h-4" />
            <span>Universal Equity Investments (NSE & BSE Cash Delivery)</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-white flex items-baseline gap-2">
            <span>₹{totalPortfolioWealth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            <span className="text-slate-500 text-xs font-normal">Total Net Worth</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/terminal" })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors shadow-md shadow-amber-500/20"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Go to F&O Terminal</span>
          </button>
          <button
            onClick={() => navigate({ to: "/" })}
            className="px-3 py-2 rounded-xl bg-[#1c2331] hover:bg-[#252f42] text-xs font-medium text-slate-300"
          >
            Gateway
          </button>
        </div>
      </header>

      {/* Portfolio Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#151a23] border border-[#22283a] space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Invested</span>
          <div className="text-lg font-black font-mono text-white">
            ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#151a23] border border-[#22283a] space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Current Value</span>
          <div className="text-lg font-black font-mono text-white">
            ₹{currentMarketValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#151a23] border border-[#22283a] space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Unrealized Returns</span>
          <div className={`text-lg font-black font-mono flex items-center gap-1 ${
            totalUnrealizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}>
            {totalUnrealizedPnL >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>
              {totalUnrealizedPnL >= 0 ? `+₹${totalUnrealizedPnL.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : `-₹${Math.abs(totalUnrealizedPnL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            </span>
            <span className="text-xs font-normal">({totalPnLPct.toFixed(2)}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#151a23] border border-[#22283a] space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Wallet className="w-3 h-3 text-amber-400" /> Segregated Cash
          </span>
          <div className="text-lg font-black font-mono text-amber-400">
            ₹{portfolio.availableCash.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* UNIVERSAL NSE & BSE SEARCH BAR */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-[#151a23] border border-[#22283a] p-1 text-xs">
            {(["ALL", "NSE", "BSE"] as const).map((exch) => (
              <button
                key={exch}
                onClick={() => setExchangeFilter(exch)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  exchangeFilter === exch
                    ? "bg-emerald-500 text-slate-950 font-black shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {exch}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center bg-[#151a23] border border-[#22283a] focus-within:border-emerald-500 rounded-2xl px-4 py-3 shadow-md transition-all">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search any stock on ${exchangeFilter === "ALL" ? "NSE & BSE (7,000+ stocks)" : exchangeFilter} (e.g. Suzlon, Tata Steel, IREDA, Mazdock)...`}
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 font-medium focus:outline-none"
            />
            {isSearching && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin mr-2" />}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-[#252f42]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchQuery.trim().length >= 2 && (
            <div className="absolute z-30 left-0 right-0 mt-2 bg-[#151a23] border border-[#2c354a] rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Searching exchange master database...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No stocks found matching "{searchQuery}" on {exchangeFilter}.
                </div>
              ) : (
                searchResults.map((stock) => (
                  <div
                    key={stock.id}
                    onClick={() => handleSelectStock(stock)}
                    className="p-3.5 hover:bg-[#1f2638] cursor-pointer flex justify-between items-center border-b border-[#1f2638] last:border-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                        stock.exchange === "NSE"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      }`}>
                        {stock.exchange}
                      </span>
                      <div>
                        <div className="text-xs font-black text-white">{stock.symbol}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{stock.name}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black font-mono text-emerald-400">
                        ₹{stock.price.toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-bold ${
                        stock.dayChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {stock.dayChangePct >= 0 ? `+${stock.dayChangePct}%` : `${stock.dayChangePct}%`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-bold animate-fadeIn">
          <CheckCircle className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* MAIN TRADING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Active Stock View */}
        <div className="lg:col-span-7 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start border-b border-[#22283a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                    selectedStock.exchange === "NSE" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                  }`}>
                    {selectedStock.exchange}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">Token: {selectedStock.token}</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">{selectedStock.name}</h2>
                <span className="text-xs font-bold text-slate-300 font-mono">Symbol: {selectedStock.symbol}</span>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ₹{selectedStock.price.toFixed(2)}
                </div>
                <div className={`text-xs font-bold ${
                  selectedStock.dayChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {selectedStock.dayChangePct >= 0 ? `+${selectedStock.dayChangePct}% Today` : `${selectedStock.dayChangePct}% Today`}
                </div>
              </div>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-[#0f141d] border border-[#1f2638] space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Portfolio Position</span>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-500">Shares Owned:</span>
                  <div className="font-bold text-white font-mono">{existingHolding ? existingHolding.qty : 0} Qty</div>
                </div>
                <div>
                  <span className="text-slate-500">Avg Buy Price:</span>
                  <div className="font-bold text-white font-mono">
                    {existingHolding ? `₹${existingHolding.avgBuyPrice.toFixed(2)}` : "—"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Invested:</span>
                  <div className="font-bold text-white font-mono">
                    {existingHolding ? `₹${existingHolding.totalInvested.toLocaleString("en-IN")}` : "₹0"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#101622] border border-[#1e273a] text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              100% Cash Delivery (CNC). Ring-fenced from F&O margin. Never subject to 3:15 PM liquidation.
            </span>
          </div>
        </div>

        {/* Right: Delivery Ticket */}
        <div className="lg:col-span-5 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#22283a] pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">CNC Delivery Ticket</span>
            <span className="text-sm font-black font-mono text-emerald-400">₹{selectedStock.price.toFixed(2)}</span>
          </div>

          {/* BUY / SELL Switch */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderSide("BUY")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase ${
                orderSide === "BUY" ? "bg-emerald-500 text-slate-950 font-black" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Buy Delivery
            </button>
            <button
              onClick={() => setOrderSide("SELL")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase ${
                orderSide === "SELL" ? "bg-rose-500 text-white font-black" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Sell Holding
            </button>
          </div>

          {/* Shares Quantity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Quantity (Shares)</span>
              <span className="font-mono text-white">{selectedStock.symbol} ({selectedStock.exchange})</span>
            </div>
            <div className="flex items-center bg-[#0f141d] border border-[#22283a] rounded-xl p-1">
              <button
                onClick={() => setSharesQty((q) => Math.max(1, q - 5))}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={sharesQty}
                onChange={(e) => setSharesQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center bg-transparent text-white font-bold font-mono text-sm focus:outline-none"
              />
              <button
                onClick={() => setSharesQty((q) => q + 5)}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Amount Math */}
          <div className="space-y-2 pt-2 text-xs border-t border-[#22283a]">
            <div className="flex justify-between">
              <span className="text-slate-400">Price per Share:</span>
              <span className="text-white font-bold font-mono">₹{selectedStock.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Capital Required:</span>
              <span className="text-white font-black font-mono text-sm">
                ₹{totalOrderAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Available Cash:</span>
              <span className="font-mono text-amber-400">₹{portfolio.availableCash.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Order Action Button */}
          <button
            type="button"
            disabled={orderSide === "BUY" ? !canBuy : !canSell}
            onClick={handleExecuteCNCOrder}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
              orderSide === "BUY"
                ? canBuy
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : canSell
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {orderSide === "BUY"
              ? canBuy
                ? `Buy ${sharesQty} Shares of ${selectedStock.symbol} (${selectedStock.exchange})`
                : "Insufficient Cash Balance"
              : canSell
              ? `Sell ${sharesQty} Shares of ${selectedStock.symbol} (${selectedStock.exchange})`
              : "Insufficient Holding Qty"}
          </button>
        </div>
      </div>

      {/* PORTFOLIO HOLDINGS TABLE */}
      <div className="bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-[#22283a] pb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Portfolio Holdings ({portfolio.holdings.length})
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            Total Invested: ₹{totalInvested.toLocaleString("en-IN")}
          </span>
        </div>

        {portfolio.holdings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No stock holdings yet. Use the universal search bar above to find and buy delivery shares across NSE & BSE.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#1f2638]">
                  <th className="pb-2">Stock</th>
                  <th className="pb-2">Exch</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Avg Buy</th>
                  <th className="pb-2">LTP</th>
                  <th className="pb-2">Current Val</th>
                  <th className="pb-2">Total P&L</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2638]">
                {portfolio.holdings.map((h) => {
                  const pnl = h.qty * h.currentPrice - h.totalInvested;
                  const pnlPct = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;

                  return (
                    <tr key={h.id} className="text-white font-mono">
                      <td className="py-3 font-bold">
                        <div>{h.symbol}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{h.name}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                          {h.sector || "NSE"}
                        </span>
                      </td>
                      <td className="py-3 font-bold">{h.qty}</td>
                      <td className="py-3">₹{h.avgBuyPrice.toFixed(2)}</td>
                      <td className="py-3 text-emerald-400">₹{h.currentPrice.toFixed(2)}</td>
                      <td className="py-3">₹{(h.qty * h.currentPrice).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td className={`py-3 font-black ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {pnl >= 0 ? `+₹${pnl.toFixed(0)}` : `-₹${Math.abs(pnl).toFixed(0)}`} ({pnlPct >= 0 ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`})
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStock({
                              id: h.id,
                              symbol: h.symbol,
                              name: h.name,
                              token: "0",
                              exchange: (h.sector as "NSE" | "BSE") || "NSE",
                              price: h.currentPrice,
                              dayChangePct: 0.5,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#252f42] hover:bg-emerald-600 text-slate-200 hover:text-white text-[11px] font-bold transition-colors"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EquityInvestmentsComponent;