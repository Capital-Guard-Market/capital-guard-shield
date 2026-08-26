import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldAlert,
  Lock,
  Zap,
  AlertTriangle,
  ArrowRight,
  Flame,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/risk-gate")({
  component: RiskGatePage,
});

function RiskGatePage() {
  const navigate = useNavigate();
  const [maxLoss, setMaxLoss] = useState<number>(5000);
  const [maxTrades, setMaxTrades] = useState<number>(5);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(2);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const handleLockAndEnter = () => {
    // Save daily guardrail rules in localStorage
    const guardrails = {
      maxLoss,
      maxTrades,
      riskPerTrade,
      lockedAt: new Date().toISOString(),
    };
    localStorage.setItem("capitalguard_rules", JSON.stringify(guardrails));
    setIsLocked(true);

    setTimeout(() => {
      navigate({ to: "/arena" });
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
          <ShieldAlert className="w-3.5 h-3.5" /> Pre-Session Risk Protocol
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Lock Today's Unbreachable Guardrails
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Once locked, these limits are non-negotiable and strictly enforced by the execution engine until midnight.
        </p>
      </div>

      {/* Guardrail Controls */}
      <div className="p-6 rounded-2xl bg-[#0e131d] border border-[#1e2638] space-y-6">
        {/* Max Daily Loss Limit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              Maximum Daily Loss Circuit (₹)
            </label>
            <span className="text-sm font-black text-red-400">
              ₹{maxLoss.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[2000, 5000, 10000, 25000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMaxLoss(val)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  maxLoss === val
                    ? "bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-500/10"
                    : "bg-[#151b26] border-[#242d40] text-slate-400 hover:text-white"
                }`}
              >
                ₹{val.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Max Allowed Trades */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Max Orders Allowed Today
            </label>
            <span className="text-sm font-black text-amber-400">
              {maxTrades} Trades
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 8, 12].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setMaxTrades(num)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  maxTrades === num
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10"
                    : "bg-[#151b26] border-[#242d40] text-slate-400 hover:text-white"
                }`}
              >
                {num} Trades
              </button>
            ))}
          </div>
        </div>

        {/* Max Risk Per Trade */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              Risk Capital Per Trade (%)
            </label>
            <span className="text-sm font-black text-blue-400">
              {riskPerTrade}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setRiskPerTrade(pct)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  riskPerTrade === pct
                    ? "bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10"
                    : "bg-[#151b26] border-[#242d40] text-slate-400 hover:text-white"
                }`}
              >
                {pct}% Capital
              </button>
            ))}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            If your cumulative intraday losses reach <strong>₹{maxLoss.toLocaleString("en-IN")}</strong> or order count reaches <strong>{maxTrades}</strong>, the F&O Arena locks automatically for the remainder of the trading day.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleLockAndEnter}
          disabled={isLocked}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
        >
          {isLocked ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Guardrails Locked — Entering Arena...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Lock Guardrails & Enter F&O Arena</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default RiskGatePage;