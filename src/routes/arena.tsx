import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Zap,
  Lock,
  Unlock,
  Flame,
  CheckCircle2,
  Percent,
  Layers,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/arena")({
  component: UnifiedArenaPage,
});

function UnifiedArenaPage() {
  // State: Guardrails
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [guardrailPercent, setGuardrailPercent] = useState<5 | 10 | 20>(5);
  const [optionsCapital, setOptionsCapital] = useState<number>(1000000); // ₹10 Lakhs
  const [futuresCapital, setFuturesCapital] = useState<number>(5000000); // ₹50 Lakhs
  const [maxTrades, setMaxTrades] = useState<number>(5);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(2);

  // State: Live Trading
  const [selectedInstrument, setSelectedInstrument] = useState<"NIFTY" | "BANKNIFTY" | "FINNIFTY">("NIFTY");
  const [activeTab, setActiveTab] = useState<"OPTIONS" | "FUTURES">("OPTIONS");
  const [selectedStrike, setSelectedStrike] = useState<number>(24500);
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE");
  const [lots, setLots] = useState<number>(2);
  const [executedTrades, setExecutedTrades] = useState<number>(0);
  const [realizedPnL, setRealizedPnL] = useState<number>(0);

  // Load saved guardrails on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("capitalguard_rules");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.locked) {
          setGuardrailPercent(parsed.guardrailPercent || 5);
          setOptionsCapital(parsed.optionsCapital || 1000000);
          setFuturesCapital(parsed.futuresCapital || 5000000);
          setMaxTrades(parsed.maxTrades || 5);
          setRiskPerTrade(parsed.riskPerTrade || 2);
          setIsLocked(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Dynamic calculations
  const calculatedOptionsMaxLoss = (optionsCapital * guardrailPercent) / 100;
  const calculatedFuturesMaxLoss = (futuresCapital * guardrailPercent) / 100;

  const spots = {
    NIFTY: { ltp: 24520.85, chg: "+86.40 (+0.35%)", positive: true, lotSize: 25 },
    BANKNIFTY: { ltp: 51840.10, chg: "-112.30 (-0.22%)", positive: false, lotSize: 15 },
    FINNIFTY: { ltp: 23610.50, chg: "+45.15 (+0.19%)", positive: true, lotSize: 25 },
  };

  const currentLotSize = spots[selectedInstrument].lotSize;
  const totalQuantity = lots * currentLotSize;
  const estimatedPremium = optionType === "CE" ? 142.50 : 118.20;
  const estimatedCost = totalQuantity * estimatedPremium;
  const strictStopLoss = optionType === "CE" ? 114.00 : 94.50;

  const handleLockGuardrails = () => {
    const rules = {
      guardrailPercent,
      optionsCapital,
      futuresCapital,
      optionsMaxLoss: calculatedOptionsMaxLoss,
      futuresMaxLoss: calculatedFuturesMaxLoss,
      maxTrades,
      riskPerTrade,
      locked: true,
      lockedAt: new Date().toISOString(),
    };
    localStorage.setItem("capitalguard_rules", JSON.stringify(rules));
    setIsLocked(true);
  };

  const handleUnlockToEdit = () => {
    setIsLocked(false);
  };

  const handlePlaceOrder = () => {
    if (executedTrades >= maxTrades) {
      alert("Circuit Breaker Active: Maximum allowed daily trades reached.");
      return;
    }
    alert(
      `Order Placed: ${selectedInstrument} ${selectedStrike} ${optionType} | Qty: ${totalQuantity} | SL Locked: ₹${strictStopLoss}`
    );
    setExecutedTrades((prev) => prev + 1);
  };

  // ==========================================
  // VIEW 1: GUARDRAIL GATE (IF NOT LOCKED)
  // ==========================================
  if (!isLocked) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" /> Pre-Session Risk Protocol
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Lock Today's Rolling Guardrails
          </h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Select your daily risk limit. Once locked, the F&O execution engine enforces these circuits automatically.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0e131d] border border-[#1e2638] space-y-6">
          {/* ROLLING POOLS */}
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

          {/* 5%, 10%, 20% SELECTOR */}
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

          {/* ₹ LOSS CIRCUIT PREVIEW */}
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

          {/* LOCK BUTTON */}
          <button
            onClick={handleLockGuardrails}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
          >
            <Lock className="w-4 h-4" />
            <span>Lock {guardrailPercent}% Guardrails & Enter Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE F&O TRADING TERMINAL
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ACTIVE GUARDRAIL HUD */}
      <div className="p-4 rounded-2xl bg-[#0e131d] border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Guardrail Protocol Enforced
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {guardrailPercent}% Rolling Max
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Loss Circuit: <strong className="text-red-400">-₹{(activeTab === "OPTIONS" ? calculatedOptionsMaxLoss : calculatedFuturesMaxLoss).toLocaleString("en-IN")}</strong> | Trades: <strong className="text-white">{executedTrades}/{maxTrades}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Today's Realized P&L</div>
            <div className={`text-base font-black ${realizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {realizedPnL >= 0 ? `+₹${realizedPnL.toLocaleString("en-IN")}` : `-₹${Math.abs(realizedPnL).toLocaleString("en-IN")}`}
            </div>
          </div>
          <button
            onClick={handleUnlockToEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161d2b] border border-[#242f44] text-xs font-bold text-slate-300 hover:text-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Adjust</span>
          </button>
        </div>
      </div>

      {/* INSTRUMENT TICKER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["NIFTY", "BANKNIFTY", "FINNIFTY"] as const).map((inst) => {
          const isSelected = selectedInstrument === inst;
          const data = spots[inst];
          return (
            <button
              key={inst}
              onClick={() => setSelectedInstrument(inst)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-[#131a26] border-amber-500 shadow-md shadow-amber-500/10"
                  : "bg-[#0e131d] border-[#1e2638] text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">{inst} INDEX</span>
                <span className={`text-xs font-black ${data.positive ? "text-emerald-400" : "text-red-400"}`}>
                  {data.chg}
                </span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                ₹{data.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN EXECUTION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OPTION CHAIN TABLE */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0e131d] border border-[#1e2638] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1c2333] pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                {selectedInstrument} Strike Chain
              </h2>
            </div>
            <div className="flex gap-1.5">
              {(["OPTIONS", "FUTURES"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-[#151b26] text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-[#1c2333]">
                  <th className="py-2.5 px-3">Call LTP (CE)</th>
                  <th className="py-2.5 px-3 text-center">Strike</th>
                  <th className="py-2.5 px-3 text-right">Put LTP (PE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151c28]">
                {[24400, 24450, 24500, 24550, 24600].map((strike) => {
                  const isAtm = strike === 24500;
                  const isCeSelected = selectedStrike === strike && optionType === "CE";
                  const isPeSelected = selectedStrike === strike && optionType === "PE";

                  return (
                    <tr key={strike} className={isAtm ? "bg-amber-500/5" : ""}>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => {
                            setSelectedStrike(strike);
                            setOptionType("CE");
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-lg font-black text-left flex items-center justify-between border transition-all ${
                            isCeSelected
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                              : "bg-[#131924] border-transparent text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <span>₹{(140 + (24500 - strike) * 0.45).toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">BUY</span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-center font-black text-white">
                        <div className="flex flex-col items-center">
                          <span>{strike}</span>
                          {isAtm && (
                            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                              ATM
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStrike(strike);
                            setOptionType("PE");
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-lg font-black text-right flex items-center justify-between border transition-all ${
                            isPeSelected
                              ? "bg-red-500/20 border-red-500 text-red-300"
                              : "bg-[#131924] border-transparent text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <span className="text-[10px] text-red-400 font-bold">BUY</span>
                          <span>₹{(120 + (strike - 24500) * 0.45).toFixed(2)}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER EXECUTION TICKET */}
        <div className="p-5 rounded-2xl bg-[#0e131d] border border-[#1e2638] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c2333] pb-3">
              <h3 className="text-sm font-black text-white">Order Execution</h3>
              <span className="text-[10px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                Auto-SL Enforced
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#121824] border border-[#1d273a] space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Contract Selected</div>
              <div className="text-sm font-black text-white">
                {selectedInstrument} {selectedStrike} {optionType}
              </div>
              <div className="text-xs text-amber-400 font-bold">
                LTP: ₹{estimatedPremium.toFixed(2)}
              </div>
            </div>

            {/* LOT SELECTOR */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Lots (1 Lot = {currentLotSize} Qty)</span>
                <span className="text-white font-black">{totalQuantity} Qty</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 8].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLots(l)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      lots === l
                        ? "bg-amber-500 text-slate-950 font-black border-amber-500"
                        : "bg-[#151b26] border-[#242d40] text-slate-300 hover:text-white"
                    }`}
                  >
                    {l} ({l * currentLotSize})
                  </button>
                ))}
              </div>
            </div>

            {/* RISK & SL CARD */}
            <div className="p-3 rounded-xl bg-[#090d14] border border-[#1c2436] space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Required Margin:</span>
                <span className="font-bold text-white">₹{estimatedCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Hard Stop-Loss:</span>
                <span className="font-bold text-red-400">₹{strictStopLoss.toFixed(2)} (-20%)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Trade Risk:</span>
                <span className="font-bold text-red-400">-₹{((estimatedPremium - strictStopLoss) * totalQuantity).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Place Disciplined Buy Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnifiedArenaPage;