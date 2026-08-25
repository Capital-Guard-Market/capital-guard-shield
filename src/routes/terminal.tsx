import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  User, 
  ChevronLeft, 
  AlertOctagon,
  Search,
  CheckCircle2
} from "lucide-react";
import { FNO_STOCKS } from "@/lib/fnoCatalog";

export const Route = createFileRoute("/terminal")({
  component: TerminalComponent,
});

const INDEX_DATA = [
  { symbol: "NIFTY", spot: 24780.35, lotSize: 65, change: "+0.45%" },
  { symbol: "BANKNIFTY", spot: 51240.80, lotSize: 30, change: "+0.62%" },
  { symbol: "SENSEX", spot: 81350.25, lotSize: 20, change: "+0.38%" },
  { symbol: "FINNIFTY", spot: 23420.60, lotSize: 60, change: "+0.15%" },
  { symbol: "MIDCPNIFTY", spot: 13150.00, lotSize: 120, change: "+0.80%" },
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function TerminalComponent() {
  const navigate = useNavigate();
  const todayKey = getTodayKey();

  // Arena & Guardrail State (Dynamically loaded from storage)
  const [arena, setArena] = useState<"options" | "futures">("options");
  const [dailyLimit, setDailyLimit] = useState<number>(5000);
  const [cumulativeLoss, setCumulativeLoss] = useState<number>(0);
  const [openPositionsCount, setOpenPositionsCount] = useState<number>(0);

  // Active Symbol & Contract
  const [selectedStock, setSelectedStock] = useState(INDEX_DATA[0]);
  const [filterType, setFilterType] = useState<"INDEX" | "STOCKS">("INDEX");
  const [searchQuery, setSearchQuery] = useState("");
  const [segment, setSegment] = useState<"CE" | "PE" | "FUT">("FUT");
  const [strike, setStrike] = useState<number>(24800);

  // Order Ticket State
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(104.20);
  const [stopLoss, setStopLoss] = useState<string>("85");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lockDate = localStorage.getItem("capitalguard_lock_date");
      const savedArena = (localStorage.getItem("capitalguard_arena") as "options" | "futures") || "options";
      const rawLimit = localStorage.getItem("capitalguard_daily_limit");
      
      // Default fallback if limit was never initialized
      const parsedLimit = rawLimit ? Number(rawLimit) : (savedArena === "futures" ? 250000 : 5000);

      // Enforce pre-market commitment gate if not locked today
      if (lockDate !== todayKey || !rawLimit) {
        navigate({ to: "/arena" });
        return;
      }

      setArena(savedArena);
      setDailyLimit(parsedLimit);
      if (savedArena === "futures") {
        setSegment("FUT");
      } else {
        setSegment("CE");
      }

      // Calculate Day's Realized Loss
      const savedPositions = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      setOpenPositionsCount(Array.isArray(savedPositions) ? savedPositions.length : 0);
      
      const dayLoss = savedPositions.reduce((acc: number, pos: any) => {
        const p = Number(pos.pnl || 0);
        return p < 0 ? acc + Math.abs(p) : acc;
      }, 0);
      setCumulativeLoss(dayLoss);
    } catch (e) {}
  }, [navigate, todayKey]);

  const totalQty = lots * selectedStock.lotSize;
  const plannedRisk = stopLoss && Number(stopLoss) > 0 ? Math.abs(entryPrice - Number(stopLoss)) * totalQty : 0;
  const isBreached = cumulativeLoss >= dailyLimit;
  const baseCapital = arena === "futures" ? 5000000 : 100000;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBreached) {
      setToastMessage("⛔ TERMINAL LOCKED: Daily Loss Floor Breached.");
      return;
    }

    if (!stopLoss || Number(stopLoss) <= 0) {
      setToastMessage("⚠️ MANDATORY STOP-LOSS REQUIRED to protect capital.");
      return;
    }

    const slNum = Number(stopLoss);
    if (orderSide === "BUY" && slNum >= entryPrice) {
      setToastMessage("⚠️ Long Stop-Loss must be lower than Entry Price.");
      return;
    }
    if (orderSide === "SELL" && slNum <= entryPrice) {
      setToastMessage("⚠️ Short Stop-Loss must be higher than Entry Price.");
      return;
    }

    const newPosition = {
      id: "pos_" + Date.now(),
      symbol: `${selectedStock.symbol} ${segment === "FUT" ? "FUT" : `${strike} ${segment}`}`,
      arena,
      orderSide,
      lots,
      lotSize: selectedStock.lotSize,
      totalQty,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss: slNum,
      pnl: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      localStorage.setItem("capitalguard_positions", JSON.stringify([newPosition, ...existing]));
      setToastMessage("✅ Position Protected & Armed under Shield!");
      setTimeout(() => navigate({ to: "/position" }), 700);
    } catch (e) {
      setToastMessage("Failed to place order.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 pb-28 max-w-7xl mx-auto space-y-4 font-sans">
      
      {/* Top Navbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/arena"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A23] border border-[#222B3A] text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Arenas</span>
          </Link>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-tight">
            Mode: {arena === "futures" ? "Futures Arena" : "Options Arena"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/position"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Positions ({openPositionsCount})</span>
          </Link>
          <Link
            to="/profile"
            className="p-2 rounded-xl bg-[#151A23] border border-[#222B3A] text-slate-300 hover:text-white"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 🛡️ PERMANENT GUARDRAIL SHIELD HUD BANNER */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
            {arena === "futures" ? "FUTURES ARENA SHIELD (LOCKED TILL 12 AM)" : "OPTIONS ARENA SHIELD (LOCKED TILL 12 AM)"}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-black text-amber-400">
              ₹{cumulativeLoss.toLocaleString("en-IN")}
            </span>
            <span className="text-sm font-mono text-slate-400">
              / ₹{dailyLimit.toLocaleString("en-IN")} Max Loss Shield
            </span>
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
            VIRTUAL MARGIN POOL
          </div>
          <div className="text-xl font-mono font-black text-white">
            ₹{baseCapital.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Circuit Breaker Alert */}
      {isBreached && (
        <div className="bg-rose-500/20 border border-rose-500/50 p-4 rounded-2xl flex items-center gap-3 text-rose-200 text-sm font-bold shadow-lg">
          <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0" />
          <span>DAILY LOSS FLOOR BREACHED. Terminal execution is locked until 12:00 AM midnight.</span>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-1 bg-[#151A23] p-1 rounded-xl border border-[#222B3A] w-full sm:w-auto">
          <button
            onClick={() => setFilterType("INDEX")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === "INDEX" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            Index F&amp;O
          </button>
          <button
            onClick={() => setFilterType("STOCKS")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === "STOCKS" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            All Stocks (180+)
          </button>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search 180+ F&O symbols (RELIANCE, ZOMATO, SBIN)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151A23] border border-[#222B3A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Quick Index Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {INDEX_DATA.map((idx) => (
          <button
            key={idx.symbol}
            onClick={() => setSelectedStock(idx)}
            className={`p-3 rounded-2xl border text-left transition ${
              selectedStock.symbol === idx.symbol
                ? "bg-[#151A23] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                : "bg-[#151A23]/60 border-[#222B3A] hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">{idx.symbol}</span>
              <span className="text-[10px] text-slate-500 font-mono">L:{idx.lotSize}</span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
              ₹{idx.spot.toLocaleString("en-IN")}
            </div>
          </button>
        ))}
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Contract Details */}
        <div className="lg:col-span-7 bg-[#151A23] border border-[#222B3A] rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[#222B3A] pb-3">
            <div>
              <h2 className="text-base font-black text-white">{selectedStock.symbol} 50</h2>
              <span className="text-xs text-slate-400 font-mono">Spot: ₹{selectedStock.spot.toLocaleString("en-IN")}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">Lot Size: {selectedStock.lotSize} Qty</span>
          </div>

          <div className="bg-[#0B0E14] border border-[#222B3A] rounded-2xl p-8 text-center space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {arena === "futures" ? "UNDERLYING FUTURES CONTRACT" : "OPTIONS CONTRACT VIEW"}
            </div>
            <div className="text-2xl font-black tracking-tight text-white">
              {selectedStock.symbol} CURRENT MONTH {arena === "futures" ? "FUT" : `${strike} ${segment}`}
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400">
              ₹{selectedStock.spot.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Margin per Lot: ₹1.25 Lakh. Mandatory Stop-loss enforces maximum downside control under active shield.
            </p>
          </div>
        </div>

        {/* Right Column: Order Execution Ticket */}
        <div className="lg:col-span-5 bg-[#151A23] border border-[#222B3A] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222B3A] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ORDER TICKET</span>
            <span className="text-sm font-mono font-bold text-amber-400">₹{entryPrice}</span>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* BUY / SELL Side */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderSide("BUY")}
                className={`py-2.5 rounded-xl text-xs font-black transition ${
                  orderSide === "BUY" ? "bg-emerald-500 text-slate-950 shadow-md" : "bg-[#0B0E14] text-slate-400 border border-[#222B3A]"
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderSide("SELL")}
                className={`py-2.5 rounded-xl text-xs font-black transition ${
                  orderSide === "SELL" ? "bg-rose-500 text-white shadow-md" : "bg-[#0B0E14] text-slate-400 border border-[#222B3A]"
                }`}
              >
                SELL
              </button>
            </div>

            {/* Lots Counter */}
            <div className="flex items-center justify-between bg-[#0B0E14] border border-[#222B3A] p-2 rounded-xl">
              <span className="text-xs text-slate-400 pl-2">Lots ({totalQty} Qty)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLots(Math.max(1, lots - 1))}
                  className="w-8 h-8 rounded-lg bg-[#151A23] border border-[#222B3A] text-slate-200 font-bold hover:text-white"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm w-6 text-center">{lots}</span>
                <button
                  type="button"
                  onClick={() => setLots(lots + 1)}
                  className="w-8 h-8 rounded-lg bg-[#151A23] border border-[#222B3A] text-slate-200 font-bold hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Entry Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full bg-[#0B0E14] border border-[#222B3A] rounded-xl p-2.5 text-xs font-mono font-bold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1 mb-1">
                  <Lock className="w-3 h-3" /> Mandatory SL (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Required"
                  className="w-full bg-[#0B0E14] border-2 border-amber-500/60 rounded-xl p-2.5 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Planned Risk Notice */}
            <div className="bg-[#0B0E14] border border-[#222B3A] rounded-xl p-3 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Planned SL Risk:</span>
              <span className="text-amber-400 font-bold">₹{plannedRisk.toLocaleString("en-IN")}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isBreached}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                isBreached
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                  : orderSide === "BUY"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg"
                  : "bg-rose-500 hover:bg-rose-400 text-white shadow-lg"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isBreached ? "Terminal Locked" : `Execute Guarded ${orderSide}`}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}