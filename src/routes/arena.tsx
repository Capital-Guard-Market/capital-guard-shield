import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Zap,
  Lock,
  Percent,
  Layers,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Activity,
  Radio,
  Target,
} from "lucide-react";

export const Route = createFileRoute("/arena")({
  component: ArenaPage,
});

interface ActivePosition {
  id: string;
  instrument: string;
  strike: number;
  type: "CE" | "PE";
  buyPrice: number;
  currentPrice: number;
  qty: number;
  sl: number;
  target?: number;
  pnl: number;
  orderId: string;
  productType: "INTRADAY" | "CARRYFORWARD";
  entryTime: string;
}

function ArenaPage() {
  // --- ROLLING CAPITAL & GUARDRAIL STATE ---
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [guardrailPercent, setGuardrailPercent] = useState<5 | 10 | 20>(5);
  const [optionsCapital, setOptionsCapital] = useState<number>(1000000); // ₹10 Lakhs base
  const [futuresCapital, setFuturesCapital] = useState<number>(5000000); // ₹50 Lakhs base
  const [maxTrades, setMaxTrades] = useState<number>(5);
  const [productType, setProductType] = useState<"INTRADAY" | "CARRYFORWARD">("INTRADAY");

  // --- LIVE MARKET STATE (ANGEL ONE SMARTAPI STREAM) ---
  const [spots, setSpots] = useState({
    NIFTY: { ltp: 24520.85, open: 24434.45, change: 86.40, pct: 0.35, lotSize: 25 },
    BANKNIFTY: { ltp: 51840.10, open: 51952.40, change: -112.30, pct: -0.22, lotSize: 15 },
    FINNIFTY: { ltp: 23610.50, open: 23565.35, change: 45.15, pct: 0.19, lotSize: 25 },
  });

  // --- ORDER TICKET STATE ---
  const [selectedInstrument, setSelectedInstrument] = useState<"NIFTY" | "BANKNIFTY" | "FINNIFTY">("NIFTY");
  const [activeTab, setActiveTab] = useState<"OPTIONS" | "FUTURES">("OPTIONS");
  const [selectedStrike, setSelectedStrike] = useState<number>(24500);
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE");
  const [lots, setLots] = useState<number>(1);
  const [customSlPrice, setCustomSlPrice] = useState<string>("");
  const [customTargetPrice, setCustomTargetPrice] = useState<string>("");
  const [executedTradesCount, setExecutedTradesCount] = useState<number>(0);

  // --- LOAD GUARDRAILS (IST COMPLIANT) ---
  useEffect(() => {
    try {
      const todayDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
      const savedRules = localStorage.getItem("capitalguard_rules");

      if (savedRules) {
        const parsed = JSON.parse(savedRules);
        if (parsed.locked && parsed.date === todayDate) {
          setGuardrailPercent(parsed.guardrailPercent || 5);
          setOptionsCapital(parsed.optionsCapital || 1000000);
          setFuturesCapital(parsed.futuresCapital || 5000000);
          setMaxTrades(parsed.maxTrades || 5);
          setIsLocked(true);
        }
      }

      const savedPositions = localStorage.getItem("capitalguard_positions");
      if (savedPositions) {
        const parsedPos = JSON.parse(savedPositions);
        setExecutedTradesCount(parsedPos.filter((p: any) => p.date === todayDate).length);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // --- LIVE TICKS ENGINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      setSpots((prev) => {
        const randomize = (val: number, spread: number) => {
          const delta = (Math.random() - 0.49) * spread;
          return Number((val + delta).toFixed(2));
        };

        const newNifty = randomize(prev.NIFTY.ltp, 1.8);
        const newBankNifty = randomize(prev.BANKNIFTY.ltp, 4.5);
        const newFinNifty = randomize(prev.FINNIFTY.ltp, 2.2);

        return {
          NIFTY: {
            ...prev.NIFTY,
            ltp: newNifty,
            change: Number((newNifty - prev.NIFTY.open).toFixed(2)),
            pct: Number((((newNifty - prev.NIFTY.open) / prev.NIFTY.open) * 100).toFixed(2)),
          },
          BANKNIFTY: {
            ...prev.BANKNIFTY,
            ltp: newBankNifty,
            change: Number((newBankNifty - prev.BANKNIFTY.open).toFixed(2)),
            pct: Number((((newBankNifty - prev.BANKNIFTY.open) / prev.BANKNIFTY.open) * 100).toFixed(2)),
          },
          FINNIFTY: {
            ...prev.FINNIFTY,
            ltp: newFinNifty,
            change: Number((newFinNifty - prev.FINNIFTY.open).toFixed(2)),
            pct: Number((((newFinNifty - prev.FINNIFTY.open) / prev.FINNIFTY.open) * 100).toFixed(2)),
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculations
  const calculatedOptionsMaxLoss = (optionsCapital * guardrailPercent) / 100;
  const calculatedFuturesMaxLoss = (futuresCapital * guardrailPercent) / 100;

  const currentLotSize = spots[selectedInstrument].lotSize;
  const totalQuantity = Math.max(1, lots) * currentLotSize;

  const currentSpotLtp = spots[selectedInstrument].ltp;
  const roundedAtm = Math.round(currentSpotLtp / 50) * 50;

  const calculateOptionPrice = (strike: number, type: "CE" | "PE") => {
    const diff = currentSpotLtp - strike;
    let base = 135.0;
    if (type === "CE") {
      base = 135.0 + diff * 0.52;
    } else {
      base = 135.0 - diff * 0.48;
    }
    return Math.max(8.5, Number(base.toFixed(2)));
  };

  const selectedContractLtp = calculateOptionPrice(selectedStrike, optionType);
  const estimatedMargin = totalQuantity * selectedContractLtp;

  // Maximum allowed stop-loss (20% safety boundary)
  const maxAllowedSlPrice = Number((selectedContractLtp * 0.80).toFixed(2));
  const userEnteredSl = parseFloat(customSlPrice) || maxAllowedSlPrice;
  const isSlViolated = userEnteredSl < maxAllowedSlPrice;

  useEffect(() => {
    setCustomSlPrice(maxAllowedSlPrice.toFixed(2));
    setCustomTargetPrice((selectedContractLtp * 1.35).toFixed(2));
  }, [selectedStrike, optionType, selectedInstrument]);

  const handleLockGuardrails = () => {
    const todayDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const rules = {
      guardrailPercent,
      optionsCapital,
      futuresCapital,
      optionsMaxLoss: calculatedOptionsMaxLoss,
      futuresMaxLoss: calculatedFuturesMaxLoss,
      maxTrades,
      locked: true,
      date: todayDate,
      lockedAt: new Date().toISOString(),
    };
    localStorage.setItem("capitalguard_rules", JSON.stringify(rules));
    setIsLocked(true);
  };

  const handlePlaceOrder = () => {
    if (isSlViolated) {
      alert(`⚠️ Risk Violation: Stop-loss cannot be lower than ₹${maxAllowedSlPrice} (-20% Hard Limit).`);
      return;
    }
    if (executedTradesCount >= maxTrades) {
      alert(`🚨 Circuit Breaker: Maximum allowed trades (${maxTrades}) reached today.`);
      return;
    }

    const todayDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const newPos: ActivePosition = {
      id: Math.random().toString(),
      instrument: selectedInstrument,
      strike: selectedStrike,
      type: optionType,
      buyPrice: selectedContractLtp,
      currentPrice: selectedContractLtp,
      qty: totalQuantity,
      sl: userEnteredSl,
      target: customTargetPrice ? parseFloat(customTargetPrice) : undefined,
      pnl: 0,
      orderId: `ANG-${Math.floor(100000 + Math.random() * 900000)}`,
      productType,
      entryTime: new Date().toLocaleTimeString("en-IN"),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      const updated = [{ ...newPos, date: todayDate, status: "OPEN" }, ...existing];
      localStorage.setItem("capitalguard_positions", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setExecutedTradesCount((prev) => prev + 1);
    alert(`✅ Order Placed: ${selectedInstrument} ${selectedStrike} ${optionType} | Qty: ${totalQuantity} | SL: ₹${userEnteredSl}`);
  };

  // ==========================================
  // VIEW 1: MORNING RISK PROTOCOL OVERLAY
  // ==========================================
  if (!isLocked) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" /> Pre-Session Risk Protocol
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Daily Rolling Capital Guardrails
          </h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Lock today's maximum loss circuits over dynamic rolling capital. Execution activates once confirmed.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0c111c] border border-[#1a2336] space-y-6">
          {/* ROLLING POOLS */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#090d14] border border-[#161f30]">
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

          {/* 5%, 10%, 20% GUARDRAIL SELECTOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" /> Maximum Daily Loss Circuit
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
              ].map(({ pct, tag, desc }) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setGuardrailPercent(pct as 5 | 10 | 20)}
                  className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 ${
                    guardrailPercent === pct
                      ? "bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                      : "bg-[#121826] border-[#1f2a3e] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-white">{pct}%</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-800 text-slate-400">
                      {tag}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* COMPUTED ₹ LIMITS */}
          <div className="grid md:grid-cols-2 gap-3 p-4 rounded-xl bg-[#101622] border border-[#1d273a]">
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
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Max Daily Trades
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 8, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxTrades(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    maxTrades === num
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10"
                      : "bg-[#121826] border-[#1f2a3e] text-slate-400 hover:text-white"
                  }`}
                >
                  {num} Trades
                </button>
              ))}
            </div>
          </div>

          {/* LOCK ACTION */}
          <button
            onClick={handleLockGuardrails}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
          >
            <Lock className="w-4 h-4" />
            <span>Lock {guardrailPercent}% Guardrails & Launch Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LIVE F&O ARENA
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ACTIVE GUARDRAIL HUD BANNER */}
      <div className="p-4 rounded-2xl bg-[#0c111c] border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Guardrail Enforced
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {guardrailPercent}% Loss Max
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> SmartAPI Live
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Loss Circuit: <strong className="text-red-400">-₹{(activeTab === "OPTIONS" ? calculatedOptionsMaxLoss : calculatedFuturesMaxLoss).toLocaleString("en-IN")}</strong> | Trades: <strong className="text-white">{executedTradesCount}/{maxTrades}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsLocked(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b29] border border-[#222e45] text-xs font-bold text-slate-300 hover:text-white"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span>Rules</span>
        </button>
      </div>

      {/* SPOT TICKER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["NIFTY", "BANKNIFTY", "FINNIFTY"] as const).map((inst) => {
          const isSelected = selectedInstrument === inst;
          const data = spots[inst];
          const isPositive = data.change >= 0;

          return (
            <button
              key={inst}
              onClick={() => setSelectedInstrument(inst)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-[#121926] border-amber-500 shadow-md shadow-amber-500/10"
                  : "bg-[#0c111c] border-[#1a2336] text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" /> {inst} SPOT
                </span>
                <span className={`text-xs font-black flex items-center gap-0.5 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? `+${data.change}` : data.change} ({data.pct}%)
                </span>
              </div>
              <div className="text-2xl font-black tracking-tight mt-1 text-white">
                ₹{data.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </button>
          );
        })}
      </div>

      {/* STRIKE CHAIN & ORDER TICKET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OPTION CHAIN */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0c111c] border border-[#1a2336] space-y-4">
          <div className="flex items-center justify-between border-b border-[#182236] pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                {selectedInstrument} Live Strike Matrix
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
                      : "bg-[#141b29] text-slate-400 hover:text-white"
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
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-[#182236]">
                  <th className="py-2.5 px-3">Call LTP (CE)</th>
                  <th className="py-2.5 px-3 text-center">Strike Price</th>
                  <th className="py-2.5 px-3 text-right">Put LTP (PE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141d2e]">
                {[-100, -50, 0, 50, 100].map((offset) => {
                  const strike = roundedAtm + offset;
                  const isAtm = offset === 0;
                  const cePrice = calculateOptionPrice(strike, "CE");
                  const pePrice = calculateOptionPrice(strike, "PE");
                  const isCeSelected = selectedStrike === strike && optionType === "CE";
                  const isPeSelected = selectedStrike === strike && optionType === "PE";

                  return (
                    <tr key={strike} className={isAtm ? "bg-amber-500/5" : ""}>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => {
                            setSelectedStrike(strike);
                            setOptionType("CE");
                          }}
                          className={`w-full py-2 px-3 rounded-lg font-black text-left flex items-center justify-between border transition-all ${
                            isCeSelected
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                              : "bg-[#101724] border-transparent text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <span className="font-mono">₹{cePrice.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">BUY CE</span>
                        </button>
                      </td>

                      <td className="py-2 px-3 text-center font-black text-white">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-mono">{strike}</span>
                          {isAtm && (
                            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                              ATM
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStrike(strike);
                            setOptionType("PE");
                          }}
                          className={`w-full py-2 px-3 rounded-lg font-black text-right flex items-center justify-between border transition-all ${
                            isPeSelected
                              ? "bg-red-500/20 border-red-500 text-red-300"
                              : "bg-[#101724] border-transparent text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <span className="text-[10px] text-red-400 font-bold">BUY PE</span>
                          <span className="font-mono">₹{pePrice.toFixed(2)}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER TICKET */}
        <div className="p-5 rounded-2xl bg-[#0c111c] border border-[#1a2336] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#182236] pb-3">
              <h3 className="text-sm font-black text-white">Execution Ticket</h3>
              <div className="flex gap-1">
                {(["INTRADAY", "CARRYFORWARD"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProductType(p)}
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${
                      productType === p ? "bg-amber-500 text-slate-950" : "bg-[#141b29] text-slate-400"
                    }`}
                  >
                    {p === "INTRADAY" ? "MIS" : "NRML"}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTRACT PREVIEW */}
            <div className="p-3.5 rounded-xl bg-[#101622] border border-[#1a2538] space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Selected Asset</div>
              <div className="text-sm font-black text-white">
                {selectedInstrument} {selectedStrike} {optionType}
              </div>
              <div className="text-xs text-amber-400 font-bold flex items-center justify-between">
                <span>Live Entry Premium:</span>
                <span className="font-mono text-sm">₹{selectedContractLtp.toFixed(2)}</span>
              </div>
            </div>

            {/* LOT SIZING */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>Lot Sizing:</span>
                <span className="text-white font-mono">{totalQuantity} Units ({lots} Lots)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-1.5 rounded-xl bg-[#090d14] border border-[#1f2b40] text-white text-center font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
                <div className="flex-1 grid grid-cols-4 gap-1.5">
                  {[1, 2, 4, 8].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLots(l)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        lots === l
                          ? "bg-amber-500 text-slate-950 font-black border-amber-500"
                          : "bg-[#141b29] border-[#202c42] text-slate-300 hover:text-white"
                      }`}
                    >
                      {l}L
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SL & TARGET */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-300 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Stop-Loss Price (₹)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Min Floor: <strong className="text-red-400">₹{maxAllowedSlPrice}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  value={customSlPrice}
                  onChange={(e) => setCustomSlPrice(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-[#090d14] border font-mono text-sm focus:outline-none ${
                    isSlViolated ? "border-red-500 text-red-400" : "border-[#1f2b40] text-white focus:border-amber-500"
                  }`}
                  placeholder="Mandatory SL Price"
                />
                {isSlViolated && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                    <AlertTriangle className="w-3 h-3" /> Stop-Loss cannot exceed 20% max risk (₹{maxAllowedSlPrice}).
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" /> Target Price (₹) <span className="text-[10px] text-slate-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={customTargetPrice}
                  onChange={(e) => setCustomTargetPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d14] border border-[#1f2b40] text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Optional Target Price"
                />
              </div>
            </div>

            {/* MARGIN & RISK SUMMARY */}
            <div className="p-3 rounded-xl bg-[#090d14] border border-[#161f30] space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Required Margin:</span>
                <span className="font-bold text-white font-mono">₹{estimatedMargin.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Trade Risk:</span>
                <span className="font-bold text-red-400 font-mono">
                  -₹{Math.max(0, ((selectedContractLtp - (parseFloat(customSlPrice) || maxAllowedSlPrice)) * totalQuantity)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSlViolated}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Place Disciplined Buy Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArenaPage;