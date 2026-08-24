import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowLeft, TrendingUp, TrendingDown, AlertOctagon } from "lucide-react";
import { inr, useSession } from "@/lib/session";

export const Route = createFileRoute("/position")({
  head: () => ({
    meta: [{ title: "Live Position 🛡️ CapitalGuard" }],
  }),
  component: PositionScreen,
});

export function PositionScreen() {
  const navigate = useNavigate();
  const session = useSession();

  // Load active position from localStorage immediately
  const [position, setPosition] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("capitalguard_position");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [currentLtp, setCurrentLtp] = useState<number>(position?.entryPrice || 0);
  const [isAutoExited, setIsAutoExited] = useState(false);

  // Sync state if localStorage changes or component remounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem("capitalguard_position");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
        setCurrentLtp(parsed.entryPrice);
      }
    } catch (e) {}
  }, []);

  // Live Price Ticks Simulator
  useEffect(() => {
    if (!position || isAutoExited) return;

    const interval = setInterval(() => {
      setCurrentLtp((prev) => {
        const delta = (Math.random() - 0.48) * (prev * 0.008);
        const nextPrice = Math.max(0.5, Number((prev + delta).toFixed(2)));

        // Shield Auto Square-off Trigger on SL hit
        if (position.type === "BUY" && nextPrice <= position.stopLoss) {
          setIsAutoExited(true);
          clearInterval(interval);
        } else if (position.type === "SELL" && nextPrice >= position.stopLoss) {
          setIsAutoExited(true);
          clearInterval(interval);
        }
        return nextPrice;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [position, isAutoExited]);

  const pnl = position
    ? position.type === "BUY"
      ? (currentLtp - position.entryPrice) * position.quantity
      : (position.entryPrice - currentLtp) * position.quantity
    : 0;

  const isProfit = pnl >= 0;
  const pnlPercent = position && position.entryPrice > 0 
    ? (((currentLtp - position.entryPrice) / position.entryPrice) * 100).toFixed(2) 
    : "0.00";

  const handleSquareOff = () => {
    localStorage.removeItem("capitalguard_position");
    setPosition(null);
    navigate({ to: "/terminal" });
  };

  if (!position) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="text-center p-8 bg-[#151A23] border border-[#222B3A] rounded-2xl max-w-sm w-full shadow-2xl">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">No Open Position</h3>
          <p className="text-slate-400 text-xs mb-5">
            Select an index or stock contract in the terminal and execute a trade.
          </p>
          <Link
            to="/terminal"
            className="block w-full py-2.5 px-4 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:brightness-110 transition-all text-center"
          >
            Open Terminal →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222B3A]">
          <Link to="/terminal" className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal</span>
          </Link>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Shield Active</span>
          </div>
        </div>

        {/* SL Hit Alert Banner */}
        {isAutoExited && (
          <div className="p-4 bg-rose-950/80 border border-rose-600 rounded-2xl flex items-start space-x-3 text-rose-200">
            <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">GUARDRAIL AUTO-EXIT TRIGGERED</div>
              <div className="text-xs text-rose-300 mt-0.5">
                Stop-loss price of ₹{position.stopLoss} was reached. Position has been automatically squared off to protect your daily limit.
              </div>
            </div>
          </div>
        )}

        {/* Live Unrealized P&L Card */}
        <div className="p-6 bg-[#151A23] border border-[#222B3A] rounded-2xl text-center shadow-xl">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Unrealized P&L</span>
          <div className={`text-4xl font-extrabold font-mono mt-2 transition-colors ${isProfit ? "text-emerald-400" : "text-rose-500"}`}>
            {isProfit ? "+" : ""}₹{pnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-center space-x-2 mt-2 text-xs text-slate-400 font-mono">
            <span>LTP: <strong className="text-white">₹{currentLtp.toFixed(2)}</strong></span>
            <span className={isProfit ? "text-emerald-400" : "text-rose-400"}>
              ({isProfit ? "+" : ""}{pnlPercent}%)
            </span>
          </div>
        </div>

        {/* Position Spec Breakdown */}
        <div className="p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <span className="font-bold text-white text-sm">{position.symbol}</span>
              <div className="text-[10px] text-slate-400">Order Time: {position.timestamp}</div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                position.type === "BUY"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {position.type}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-300">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">Position Size</span>
              <p className="font-mono font-bold text-sm text-slate-100">
                {position.quantity} Qty ({position.lots} {position.lots > 1 ? "Lots" : "Lot"})
              </p>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">Entry Price</span>
              <p className="font-mono font-bold text-sm text-slate-100">₹{Number(position.entryPrice).toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">Hard Stop-Loss</span>
              <p className="font-mono font-bold text-sm text-rose-400">₹{Number(position.stopLoss).toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-slate-500 text-[10px] block">Capital Deployed</span>
              <p className="font-mono font-bold text-sm text-amber-400">
                ₹{Number(position.capitalRequired || position.plannedRisk).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Square Off Button */}
        <button
          onClick={handleSquareOff}
          className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs tracking-wider shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]"
        >
          {isAutoExited ? "DISMISS & RETURN TO TERMINAL" : "SQUARE OFF POSITION"}
        </button>
      </div>
    </div>
  );
}