import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertOctagon, 
  ChevronDown 
} from "lucide-react";
import { FNO_STOCKS } from "@/lib/fnoCatalog";

export const Route = createFileRoute("/terminal")({
  component: TerminalComponent,
});

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function TerminalComponent() {
  const navigate = useNavigate();
  const todayKey = getTodayKey();

  const [arena, setArena] = useState<"options" | "futures">("options");
  const [dailyLimit, setDailyLimit] = useState<number>(5000);
  const [cumulativeLoss, setCumulativeLoss] = useState<number>(0);
  const [totalPnl, setTotalPnl] = useState<number>(0);

  const [symbol, setSymbol] = useState(FNO_STOCKS[0]?.symbol || "NIFTY");
  const [segment, setSegment] = useState<"CE" | "PE" | "FUT">("CE");
  const [strike, setStrike] = useState<number>(24500);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(120);
  const [stopLoss, setStopLoss] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lockDate = localStorage.getItem("capitalguard_lock_date");
      const savedArena = (localStorage.getItem("capitalguard_arena") as "options" | "futures") || "options";
      const savedLimit = Number(localStorage.getItem("capitalguard_daily_limit"));

      if (lockDate !== todayKey || !savedLimit) {
        navigate({ to: "/arena" });
        return;
      }

      setArena(savedArena);
      setDailyLimit(savedLimit);
      if (savedArena === "futures") setSegment("FUT");

      const savedPositions = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      let dayLoss = 0;
      let netPnl = 0;
      savedPositions.forEach((pos: any) => {
        const p = Number(pos.pnl || 0);
        netPnl += p;
        if (p < 0) dayLoss += Math.abs(p);
      });
      setCumulativeLoss(dayLoss);
      setTotalPnl(netPnl);
    } catch (e) {}
  }, [navigate, todayKey]);

  const selectedStock = FNO_STOCKS.find((s) => s.symbol === symbol) || FNO_STOCKS[0];
  const lotSize = selectedStock?.lotSize || 50;
  const totalQty = lots * lotSize;
  const maxTradeRisk = stopLoss ? Math.abs(entryPrice - Number(stopLoss)) * totalQty : 0;
  const isBreached = cumulativeLoss >= dailyLimit;
  const lossPercentage = Math.min(100, Math.round((cumulativeLoss / dailyLimit) * 100));

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBreached) {
      setToastMessage("⛔ TERMINAL LOCKED: Daily Loss Floor breached. No new trades allowed.");
      return;
    }

    if (!stopLoss || Number(stopLoss) <= 0) {
      setToastMessage("⚠️ MANDATORY STOP-LOSS: CapitalGuard refuses orders without a hard Stop-Loss.");
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
      symbol: `${symbol} ${segment === "FUT" ? "FUT" : `${strike} ${segment}`}`,
      arena,
      orderSide,
      lots,
      lotSize,
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
      setToastMessage("✅ Position Protected & Placed!");
      setTimeout(() => navigate({ to: "/position" }), 800);
    } catch (e) {
      setToastMessage("Failed to place position.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 pb-28 max-w-xl mx-auto space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-black tracking-tight text-base text-white">CAPITALGUARD</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#151A23] border border-[#222B3A] text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold">NSE LIVE</span>
        </div>
      </div>

      {/* Account Balance Card */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 shadow-xl space-y-2">
        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          {arena === "futures" ? "Futures Portfolio Capital Base" : "Options Trading Account"}
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black font-mono text-white">
            ₹{arena === "futures" ? (5000000 + totalPnl).toLocaleString("en-IN") : (100000 + totalPnl).toLocaleString("en-IN")}
          </div>
          <div className={`text-xs font-mono font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {totalPnl >= 0 ? `+₹${totalPnl.toLocaleString("en-IN")}` : `-₹${Math.abs(totalPnl).toLocaleString("en-IN")}`}
          </div>
        </div>
      </div>

      {/* 3 Risk KPI Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#151A23] border border-[#222B3A] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" /> Floor
          </span>
          <div className="text-xs font-mono font-bold text-amber-400">
            ₹{dailyLimit.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="bg-[#151A23] border border-[#222B3A] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" /> Risk Used
          </span>
          <div className={`text-xs font-mono font-bold ${lossPercentage >= 80 ? "text-rose-400" : "text-slate-200"}`}>
            {lossPercentage}%
          </div>
        </div>

        <div className="bg-[#151A23] border border-[#222B3A] rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" /> Shield
          </span>
          <div className="text-xs font-mono font-bold text-emerald-400">
            {isBreached ? "LOCKED" : "ARMED"}
          </div>
        </div>
      </div>

      {isBreached && (
        <div className="bg-rose-500/20 border border-rose-500/50 p-3.5 rounded-xl flex items-center gap-3 text-rose-200 text-xs font-bold shadow-lg">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
          <span>Daily Loss Floor Reached. Terminal is locked until 12:00 AM midnight.</span>
        </div>
      )}

      {toastMessage && (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Order Entry Form */}
      <form onSubmit={handlePlaceOrder} className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 space-y-3.5 shadow-xl">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Symbol
            </label>
            <div className="relative">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#222B3A] text-white text-xs font-bold rounded-xl p-2.5 appearance-none focus:border-amber-400 outline-none"
              >
                {FNO_STOCKS.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} (Lot: {s.lotSize})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Segment
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#0B0E14] p-1 rounded-xl border border-[#222B3A]">
              {(["CE", "PE", "FUT"] as const).map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setSegment(seg)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    segment === seg
                      ? seg === "PE"
                        ? "bg-rose-500 text-white"
                        : "bg-amber-400 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {segment !== "FUT" && (
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Strike Price
            </label>
            <input
              type="number"
              value={strike}
              onChange={(e) => setStrike(Number(e.target.value))}
              className="w-full bg-[#0B0E14] border border-[#222B3A] text-white text-sm font-mono font-bold rounded-xl p-2.5 outline-none focus:border-amber-400"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Side
            </label>
            <div className="grid grid-cols-2 gap-1 bg-[#0B0E14] p-1 rounded-xl border border-[#222B3A]">
              <button
                type="button"
                onClick={() => setOrderSide("BUY")}
                className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${
                  orderSide === "BUY" ? "bg-emerald-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderSide("SELL")}
                className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${
                  orderSide === "SELL" ? "bg-rose-500 text-white font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                SELL
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Lots (Qty: {totalQty})
            </label>
            <input
              type="number"
              min={1}
              value={lots}
              onChange={(e) => setLots(Math.max(1, Number(e.target.value)))}
              className="w-full bg-[#0B0E14] border border-[#222B3A] text-white text-sm font-mono font-bold rounded-xl p-2.5 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Entry Price (₹)
            </label>
            <input
              type="number"
              step="0.05"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="w-full bg-[#0B0E14] border border-[#222B3A] text-white text-sm font-mono font-bold rounded-xl p-2.5 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" /> Stop-Loss *
              </label>
              <span className="text-[9px] text-amber-400/80 font-bold uppercase">Mandatory</span>
            </div>
            <input
              type="number"
              step="0.05"
              placeholder="Required"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-[#0B0E14] border-2 border-amber-500/60 text-amber-300 placeholder-slate-600 text-sm font-mono font-bold rounded-xl p-2.5 outline-none focus:border-amber-400"
              required
            />
          </div>
        </div>

        {stopLoss && Number(stopLoss) > 0 && (
          <div className="bg-[#0B0E14] border border-[#222B3A] rounded-xl p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Calculated Risk Ceiling:</span>
            <span className="text-rose-400 font-bold">₹{maxTradeRisk.toLocaleString("en-IN")}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isBreached}
          className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition ${
            isBreached
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : orderSide === "BUY"
              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              : "bg-rose-500 hover:bg-rose-400 text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isBreached ? "Terminal Locked" : `Execute Guarded ${orderSide}`}</span>
        </button>
      </form>
    </div>
  );
}