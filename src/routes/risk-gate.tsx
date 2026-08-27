import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Lock,
  Zap,
  AlertTriangle,
  ArrowRight,
  Flame,
  CheckCircle2,
  Percent,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/risk-gate")({
  component: RiskGatePage,
});

function RiskGatePage() {
  const [optionsCapital, setOptionsCapital] = useState<number>(1000000); // 10 Lakhs
  const [futuresCapital, setFuturesCapital] = useState<number>(5000000); // 50 Lakhs
  const [guardrailPercent, setGuardrailPercent] = useState<5 | 10 | 20>(5);
  const [maxTrades, setMaxTrades] = useState<number>(5);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(2);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem("capitalguard_state");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.optionsCapital) setOptionsCapital(parsed.optionsCapital);
        if (parsed.futuresCapital) setFuturesCapital(parsed.futuresCapital);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const calculatedOptionsMaxLoss = (optionsCapital * guardrailPercent) / 100;
  const calculatedFuturesMaxLoss = (futuresCapital * guardrailPercent) / 100;
  const calculatedCombinedMaxLoss = calculatedOptionsMaxLoss + calculatedFuturesMaxLoss;

  const handleLockAndEnter = () => {
    const guardrailRules = {
      guardrailPercent,
      optionsCapital,
      futuresCapital,
      optionsMaxLoss: calculatedOptionsMaxLoss,
      futuresMaxLoss: calculatedFuturesMaxLoss,
      combinedMaxLoss: calculatedCombinedMaxLoss,
      maxTrades,
      riskPerTrade,
      locked: true,
      lockedAt: new Date().toISOString(),
    };

    localStorage.setItem("capitalguard_rules", JSON.stringify(guardrailRules));
    setIsLocked(true);

    // Direct window transition to guarantee arena hydration
    setTimeout(() => {
      window.location.href = "/arena";
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
          <ShieldAlert className="w-3.5 h-3.5" /> Pre-Session Risk Protocol
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Rolling Capital Guardrails
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Enforce strict percentage-based loss circuits over dynamic rolling capital before entering the F&O Arena.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0e131d] border border-[#1e2638] space-y-6">
        {/* ACTIVE ROLLING CAPITAL */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#090d14] border border-[#1a2233]">
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" /> Options Pool (Rolling)
            </div>
            <div className="text-base md:text-lg font-black text-amber-400 mt-1">
              ₹{optionsCapital.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-blue-400" /> Futures Pool (Rolling)
            </div>
            <div className="text-base md:text-lg font-black text-blue-400 mt-1">
              ₹{futuresCapital.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* 5%, 10%, 20% GUARDRAIL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              Maximum Daily Loss Circuit
            </label>
            <span className="text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              {guardrailPercent}% Rolling Capital
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { pct: 5, tag: "Conservative", desc: "Safe capital preservation" },
              { pct: 10, tag: "Balanced", desc: "Standard intraday buffer" },
              { pct: 20, tag: "Dynamic Max", desc: "High volatility expansion" },
            ].map(({ pct, tag, desc }) => {
              const selected = guardrailPercent === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setGuardrailPercent(pct as 5 | 10 | 20)}
                  className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 ${
                    selected
                      ? "bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                      : "bg-[#151b26] border-[#242d40] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-white">{pct}%</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        selected
                          ? "bg-amber-500 text-slate-950 font-black"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {tag}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">{desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COMPUTED ₹ VALUES */}
        <div className="grid md:grid-cols-2 gap-3 p-4 rounded-xl bg-[#121824] border border-[#1f293d]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold">Options Loss Limit ({guardrailPercent}%):</span>
            <span className="text-xs font-black text-red-400">
              -₹{calculatedOptionsMaxLoss.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold">Futures Loss Limit ({guardrailPercent}%):</span>
            <span className="text-xs font-black text-red-400">
              -₹{calculatedFuturesMaxLoss.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* MAX TRADES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Max Allowed Orders Today
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

        {/* RISK PER TRADE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              Risk Capital Per Trade (%)
            </label>
            <span className="text-sm font-black text-blue-400">
              {riskPerTrade}% Allocation
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

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            If your Options losses hit <strong>₹{calculatedOptionsMaxLoss.toLocaleString("en-IN")}</strong> or Futures losses hit <strong>₹{calculatedFuturesMaxLoss.toLocaleString("en-IN")}</strong> ({guardrailPercent}% of rolling capital), the terminal locks immediately until midnight.
          </p>
        </div>

        <button
          onClick={handleLockAndEnter}
          disabled={isLocked}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
        >
          {isLocked ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Guardrails Locked ({guardrailPercent}%) — Launching Arena...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Lock {guardrailPercent}% Guardrails & Enter Arena</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default RiskGatePage;