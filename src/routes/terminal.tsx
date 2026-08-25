import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  CheckCircle2, 
  Info,
  ChevronDown
} from "lucide-react";
import { FNO_STOCKS } from "@/lib/fnoCatalog";

export const Route = createFileRoute("/terminal")({
  component: TerminalComponent,
});

export function TerminalComponent() {
  const navigate = useNavigate();

  // Guardrail state
  const [arena, setArena] = useState<"options" | "futures">("options");
  const [dailyLimit, setDailyLimit] = useState<number>(5000);
  const [cumulativeLoss, setCumulativeLoss] = useState<number>(0);

  // Trading form state
  const [symbol, setSymbol] = useState(FNO_STOCKS[0]?.symbol || "NIFTY");
  const [segment, setSegment] = useState<"CE" | "PE" | "FUT">("CE");
  const [strike, setStrike] = useState<number>(24500);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(120);
  const [stopLoss, setStopLoss] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load active Guardrail Shield configuration
  useEffect(() => {
    try {
      const savedArena = (localStorage.getItem("capitalguard_arena") as "options" | "futures") || "options";
      const savedLimit = Number(localStorage.getItem("capitalguard_daily_limit")) || (savedArena === "futures" ? 250000 : 5000);
      setArena(savedArena);
      setDailyLimit(savedLimit);

      // Default segment to FUT if in futures arena
      if (savedArena === "futures") {
        setSegment("FUT");
      }

      // Calculate cumulative loss from closed positions today
      const savedPositions = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      const dayLoss = savedPositions.reduce((acc: number, pos: any) => {
        const pnl = Number(pos.pnl || 0);
        return pnl < 0 ? acc + Math.abs(pnl) : acc;
      }, 0);
      setCumulativeLoss(dayLoss);
    } catch (e) {}
  }, []);

  const selectedStock = FNO_STOCKS.find((s) => s.symbol === symbol) || FNO_STOCKS[0];
  const lotSize = selectedStock?.lotSize || 50;
  const totalQty = lots * lotSize;
  const maxRiskRupees = stopLoss ? Math.abs(entryPrice - Number(stopLoss)) * totalQty : 0;
  const isBreached = cumulativeLoss >= dailyLimit;
  const lossPercentage = Math.min(100, Math.round((cumulativeLoss / dailyLimit) * 100));

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBreached) {
      setToastMessage("⛔ TERMINAL LOCKED: Daily Guardrail Loss Floor Breached.");
      return;
    }

    if (!stopLoss || Number(stopLoss) <= 0) {
      setToastMessage("⚠️ MANDATORY STOP-LOSS REQUIRED: CapitalGuard refuses orders without a hard Stop-Loss.");
      return;
    }

    const slNum = Number(stopLoss);
    if (orderSide === "BUY" && slNum >= entryPrice) {
      setToastMessage("⚠️ Invalid SL: Long Stop-Loss must be lower than entry price.");
      return;
    }
    if (orderSide === "SELL" && slNum <= entryPrice) {
      setToastMessage("⚠️ Invalid SL: Short Stop-Loss must be higher than entry price.");
      return;
    }

    // Save Position to LocalStorage
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
      target: target ? Number(target) : null,
      pnl: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      localStorage.setItem("capitalguard_positions", JSON.stringify([newPosition, ...existing]));
      setToastMessage("✅ Position Protected & Placed! Guardrail Armed.");
      setTimeout(() => {
        navigate({ to: "/position" });
      }, 900);
    } catch (e) {
      setToastMessage("Failed to record position.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 pb-28 max-w-xl mx-auto space-y-4">
      
      {/* 🛡️ PERMANENT GUARDRAIL SHIELD HUD BANNER */}
      <div className="bg-[#151A23] border border-amber-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {arena === "futures" ? "Futures Shield (₹50L Capital)" : "Options Shield"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Loss Floor: <span className="text-white font-bold">₹{dailyLimit.toLocaleString("en-IN")}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate({ to: "/arena" })}
            className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </button>
        </div>

        {/* Real-time Loss Meter */}
        <div className="mt-3 pt-3 border-t border-[#222B3A] space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Intraday Risk Consumption:</span>
            <span className={isBreached ? "text-rose-400 font-bold" : "text-slate-300"}>
              ₹{cumulativeLoss.toLocaleString("en-IN")} / ₹{dailyLimit.toLocaleString("en-IN")} ({lossPercentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-[#0B0E14] rounded-full overflow-hidden border border-[#222B3A]">
            <div
              className={`h-full transition-all duration-500 ${
                lossPercentage >= 90 ? "bg-rose-500" : lossPercentage >= 60 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${lossPercentage}%` }}
            />
          </div>
        </div>

        {isBreached && (
          <div className="mt-3 bg-rose-500/20 border border-rose-500/40 rounded-xl p-2.5 flex items-center gap-2 text-rose-300 text-xs font-bold">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Daily Floor Breached. Terminal locked to protect your capital.</span>
          </div>
        )}
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* 🚀 ORDER EXECUTION FORM */}
      <form onSubmit={handlePlaceOrder} className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 space-y-4 shadow-xl">
        
        {/* Symbol & Segment Selector */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Instrument
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

        {/* Strike Selection (If not FUT) */}
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

        {/* Buy / Sell Buttons & Lots */}
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

        {/* Entry Price & Mandatory Stop Loss */}
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
                <Lock className="w-3 h-3" />
                Stop-Loss (₹) *
              </label>
              <span className="text-[9px] text-amber-400/80 font-semibold uppercase">Mandatory</span>
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

        {/* Max Calculated Risk Notice */}
        {stopLoss && Number(stopLoss) > 0 && (
          <div className="bg-[#0B0E14] border border-[#222B3A] rounded-xl p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Trade Risk Ceiling:</span>
            <span className="text-rose-400 font-bold">₹{maxRiskRupees.toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Submit Button */}
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
          <span>{isBreached ? "Terminal Locked (Risk Floor Breached)" : `Execute Guarded ${orderSide}`}</span>
        </button>
      </form>
    </div>
  );
}