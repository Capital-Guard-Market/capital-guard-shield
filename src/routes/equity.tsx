import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Flame, 
  Wallet, 
  Trash2, 
  ChevronRight 
} from "lucide-react";

export const Route = createFileRoute("/equity")({
  component: EquityHomeComponent,
});

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  high52: number;
  low52: number;
  holdingsQty?: number;
}

const DEFAULT_STOCKS: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2940.50, change: 1.45, high52: 3024.90, low52: 2220.30, holdingsQty: 25 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", price: 1640.20, change: -0.65, high52: 1794.00, low52: 1363.55, holdingsQty: 50 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 4190.00, change: 0.85, high52: 4585.90, low52: 3313.00, holdingsQty: 10 },
  { symbol: "INFY", name: "Infosys Ltd", price: 1860.10, change: 2.10, high52: 1953.90, low52: 1358.35, holdingsQty: 40 },
  { symbol: "SBIN", name: "State Bank of India", price: 825.40, change: -1.15, high52: 912.00, low52: 555.30, holdingsQty: 100 },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", price: 985.30, change: 3.20, high52: 1179.05, low52: 593.50, holdingsQty: 60 },
  { symbol: "ITC", name: "ITC Limited", price: 485.60, change: 0.25, high52: 528.55, low52: 399.30, holdingsQty: 150 },
  { symbol: "ZOMATO", name: "Zomato Ltd", price: 260.40, change: 4.80, high52: 298.20, low52: 110.50, holdingsQty: 300 },
];

export function EquityHomeComponent() {
  const navigate = useNavigate();

  // Watchlists state
  const [watchlists, setWatchlists] = useState<string[]>(["Nifty Largecap", "High Growth Tech"]);
  const [activeWatchlist, setActiveWatchlist] = useState<string>("Nifty Largecap");
  const [stocks, setStocks] = useState<Stock[]>(DEFAULT_STOCKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Portfolio Funds Breakdown
  const totalFunds = 1000000;
  const portfolioInvested = stocks.reduce((acc, s) => acc + (s.holdingsQty || 0) * (s.price * 0.92), 0);
  const portfolioCurrent = stocks.reduce((acc, s) => acc + (s.holdingsQty || 0) * s.price, 0);
  const portfolioProfit = portfolioCurrent - portfolioInvested;
  const availableCash = totalFunds - portfolioInvested;

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlistName.trim() && !watchlists.includes(newWatchlistName.trim())) {
      setWatchlists([...watchlists, newWatchlistName.trim()]);
      setActiveWatchlist(newWatchlistName.trim());
      setNewWatchlistName("");
      setShowAddModal(false);
    }
  };

  const filteredStocks = stocks.filter(
    (s) => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner: Switch to F&O Arena */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Investments Realm (Home)</h1>
            <p className="text-xs text-slate-400">Cash Equity Watchlists, Portfolio &amp; Funds Tracker</p>
          </div>
        </div>

        <Link
          to="/terminal"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/10"
        >
          <Flame className="w-4 h-4" />
          <span>Switch to F&amp;O Arena</span>
        </Link>
      </div>

      {/* Funds & Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Portfolio Value</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-black text-white">
            ₹{portfolioCurrent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs font-mono text-emerald-400 font-bold">
            +₹{portfolioProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })} (+{((portfolioProfit / portfolioInvested) * 100).toFixed(2)}%)
          </div>
        </div>

        <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Available Cash</span>
            <PieChart className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-black text-emerald-400">
            ₹{availableCash.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Total Capital: ₹{totalFunds.toLocaleString("en-IN")}</p>
        </div>

        <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Invested Capital</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-black text-slate-200">
            ₹{portfolioInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">{stocks.filter(s => (s.holdingsQty || 0) > 0).length} Active Holdings</p>
        </div>
      </div>

      {/* Watchlists Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {watchlists.map((wl) => (
            <button
              key={wl}
              onClick={() => setActiveWatchlist(wl)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeWatchlist === wl
                  ? "bg-amber-400 text-slate-950 font-black shadow-md"
                  : "bg-[#151A23] text-slate-400 hover:text-white border border-[#222B3A]"
              }`}
            >
              {wl}
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#151A23] border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:border-amber-400 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New List</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search equity stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151A23] border border-[#222B3A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Create Watchlist Modal */}
      {showAddModal && (
        <form onSubmit={handleCreateWatchlist} className="bg-[#151A23] border border-[#222B3A] p-4 rounded-2xl flex items-center gap-3">
          <input
            type="text"
            placeholder="Enter custom watchlist name (e.g. Dividend Kings, EV Plays)..."
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            className="flex-1 bg-[#0B0E14] border border-[#222B3A] rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
          >
            Create List
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="text-xs text-slate-400 hover:text-white px-2"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Stock Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredStocks.map((stock) => (
          <div
            key={stock.symbol}
            className="bg-[#151A23] border border-[#222B3A] hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">{stock.symbol}</span>
                <span className={`text-xs font-mono font-bold ${stock.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {stock.change >= 0 ? `+${stock.change}%` : `${stock.change}%`}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 line-clamp-1">{stock.name}</span>
            </div>

            <div className="border-t border-[#222B3A] pt-2.5 flex items-end justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">LTP</span>
                <span className="text-base font-mono font-black text-white">₹{stock.price.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">52W Range</span>
                <span className="text-[10px] text-slate-400 font-mono">₹{stock.low52} - ₹{stock.high52}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}