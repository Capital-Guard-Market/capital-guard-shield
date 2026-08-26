import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLiveMarket } from "../hooks/useLiveMarket";
import {
  loadGuardrailState,
  GuardrailState,
} from "../lib/guardrailStore";
import {
  Lock,
  ShieldCheck,
  Zap,
  Flame,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/terminal")({
  component: TerminalComponent,
});

interface InstrumentConfig {
  id: string;
  symbol: string;
  name: string;
  lotSize: number;
  spanMargin: number;
  defaultPrice: number;
}

const INSTRUMENTS: InstrumentConfig[] = [
  { id: "NIFTY", symbol: "NIFTY", name: "NIFTY 50", lotSize: 65, spanMargin: 125000, defaultPrice: 24317.40 },
  { id: "BANKNIFTY", symbol: "BANKNIFTY", name: "BANK NIFTY", lotSize: 30, spanMargin: 145000, defaultPrice: 57910.85 },
  { id: "SENSEX", symbol: "SENSEX", name: "BSE SENSEX", lotSize: 20, spanMargin: 135000, defaultPrice: 81350.25 },
  { id: "FINNIFTY", symbol: "FINNIFTY", name: "FIN NIFTY", lotSize: 60, spanMargin: 110000, defaultPrice: 23420.60 },
  { id: "MIDCPNIFTY", symbol: "MIDCPNIFTY", name: "MIDCAP NIFTY", lotSize: 120, spanMargin: 95000, defaultPrice: 13150.00 },
];

export function TerminalComponent() {
  const navigate = useNavigate();
  const { bySymbol, isLive } = useLiveMarket();
  const [guardrail, setGuardrail] = useState<GuardrailState>(loadGuardrailState());

  const [arenaMode, setArenaMode] = useState<"FUTURES" | "OPTIONS">("FUTURES");
  const [selectedInstId, setSelectedInstId] = useState<string>("NIFTY");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState<number>(1);

  useEffect(() => {
    const current = loadGuardrailState();
    if (!current.isLocked) {
      navigate({ to: "/" });
    } else {
      setGuardrail(current);
    }
  }, [navigate]);

  const activeShield = arenaMode === "FUTURES" ? guardrail.futures : guardrail.options;
  const activeCapital = activeShield.capital;
  const activeLossFloor = activeShield.maxDailyLoss;
  const activeDrawdown = activeShield.currentDrawdown;

  const activeInstrument = useMemo(() => {
    return INSTRUMENTS.find((i) => i.id === selectedInstId) || INSTRUMENTS[0];
  }, [selectedInstId]);

  const livePrice = bySymbol[activeInstrument.symbol]?.ltp ?? activeInstrument.defaultPrice;
  const [customSL, setCustomSL] = useState<number>(() => Math.round(livePrice * 0.985));

  const drawdownPct = (activeDrawdown / activeCapital) * 100;
  const isTier1 = drawdownPct >= 5;
  const isTier2 = drawdownPct >= 10;
  const isTier3 = drawdownPct >= 20 || activeShield.isBreached;

  const maxAllowedLots = isTier3 ? 0 : isTier2 ? 1 : isTier1 ? 5 : 50;

  const totalQty = lots * activeInstrument.lotSize;
  const marginRequired = lots * activeInstrument.spanMargin;
  const plannedRisk = Math.abs(livePrice - customSL) * totalQty;
  const willBreach = (activeDrawdown + plannedRisk > activeLossFloor) || isTier3;

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#151a23] border border-[#22283a] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Lock className="w-3.5 h-3.5" />
            <span>{arenaMode} Guardrail Active (Locked till 12 AM)</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-white flex items-baseline gap-2">
            <span className={activeDrawdown > 0 ? "text-rose-400" : "text-emerald-400"}>
              ₹{activeDrawdown.toLocaleString("en-IN")}
            </span>
            <span className="text-slate-500 text-sm font-normal">
              / ₹{activeLossFloor.toLocaleString("en-IN")} Daily Max Floor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
            isLive ? "bg-emerald-950/80 border-emerald-500 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span>ANGEL ONE LIVE</span>
          </div>

          <button
            onClick={() => navigate({ to: "/" })}
            className="px-3 py-1.5 rounded-xl bg-[#1c2331] hover:bg-[#252f42] text-xs font-medium text-slate-300 transition-colors"
          >
            Switch Realm
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setArenaMode("FUTURES")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
            arenaMode === "FUTURES"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-[#151a23] text-slate-400 border border-[#22283a]"
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Futures Arena (₹{guardrail.futures.capital.toLocaleString("en-IN")} Pool)</span>
        </button>

        <button
          onClick={() => setArenaMode("OPTIONS")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
            arenaMode === "OPTIONS"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-[#151a23] text-slate-400 border border-[#22283a]"
          }`}
        >
          <Flame className="w-4 h-4 fill-current" />
          <span>Options Arena (₹{guardrail.options.capital.toLocaleString("en-IN")} Pool)</span>
        </button>
      </div>

      {isTier2 && !isTier3 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-950/40 border border-orange-500/40 text-orange-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Tier 2 (10% Drawdown) Active: New orders strictly limited to 1 Lot maximum.</span>
        </div>
      )}

      {isTier3 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs font-bold">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Tier 3 (20% Max Drawdown) Breached: {arenaMode} trading is fully locked until 12:00 AM.</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {INSTRUMENTS.map((inst) => {
          const ltp = bySymbol[inst.symbol]?.ltp ?? inst.defaultPrice;
          const isSelected = selectedInstId === inst.id;
          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInstId(inst.id)}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? "bg-[#182030] border-amber-400 shadow-md ring-1 ring-amber-400/50"
                  : "bg-[#151a23] border-[#22283a] hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between text-xs font-bold text-white">
                <span>{inst.name}</span>
                <span className="text-[10px] text-slate-400">Lot: {inst.lotSize}</span>
              </div>
              <div className="mt-2 text-base font-extrabold text-emerald-400 font-mono">
                ₹{ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start border-b border-[#22283a] pb-4">
              <div>
                <h2 className="text-xl font-black text-white">{activeInstrument.name}</h2>
                <p className="text-xs text-slate-400">
                  Spot: <span className="font-mono text-emerald-400">₹{livePrice.toLocaleString("en-IN")}</span>
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono">Lot Size: {activeInstrument.lotSize} Qty</span>
            </div>

            <div className="my-8 py-8 rounded-2xl bg-[#0f141d] border border-[#1f2638] text-center space-y-2">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                {arenaMode} Active Contract
              </span>
              <h3 className="text-2xl font-black text-white">{activeInstrument.symbol} CURRENT MONTH</h3>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono animate-pulse">
                ₹{livePrice.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#101622] border border-[#1e273a] text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Non-overlapping guardrail active. {arenaMode} risk operates strictly within its designated capital.</span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#22283a] pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Order Ticket</span>
            <span className="text-sm font-black font-mono text-amber-400">₹{livePrice.toLocaleString("en-IN")}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderSide("BUY")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase ${
                orderSide === "BUY" ? "bg-emerald-500 text-slate-950 font-black" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setOrderSide("SELL")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase ${
                orderSide === "SELL" ? "bg-rose-500 text-white font-black" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Lots (Max Allowed: {maxAllowedLots})</span>
              <span className="font-mono">Qty: {totalQty}</span>
            </div>
            <div className="flex items-center bg-[#0f141d] border border-[#22283a] rounded-xl p-1">
              <button
                disabled={isTier3}
                onClick={() => setLots((l) => Math.max(1, l - 1))}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] text-white disabled:opacity-50"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                disabled={isTier3}
                min={1}
                max={maxAllowedLots}
                value={lots}
                onChange={(e) => setLots(Math.min(maxAllowedLots, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full text-center bg-transparent text-white font-bold font-mono text-sm focus:outline-none disabled:opacity-50"
              />
              <button
                disabled={isTier3}
                onClick={() => setLots((l) => Math.min(maxAllowedLots, l + 1))}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] text-white disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">Entry Price (₹)</label>
              <input
                type="number"
                value={livePrice}
                readOnly
                className="w-full py-2 px-3 rounded-xl bg-[#0f141d] border border-[#22283a] text-xs font-mono font-bold text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mandatory SL (₹)
              </label>
              <input
                type="number"
                disabled={isTier3}
                value={customSL}
                onChange={(e) => setCustomSL(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-[#0f141d] border border-amber-500/40 text-xs font-mono font-bold text-amber-300 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-[#22283a]">
            <div className="flex justify-between">
              <span className="text-slate-400">Capital Req:</span>
              <span className="text-white font-bold font-mono">₹{marginRequired.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400 font-semibold">Planned Trade Risk:</span>
              <span className={`font-bold font-mono ${willBreach ? "text-rose-500" : "text-amber-400"}`}>
                ₹{plannedRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={willBreach}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
              willBreach
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : orderSide === "BUY"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
            }`}
          >
            {willBreach ? "RISK BREACH: ORDER BLOCKED" : `${orderSide} ${activeInstrument.symbol} (${totalQty} Qty)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerminalComponent;