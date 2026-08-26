import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useLiveMarket } from "../hooks/useLiveMarket";
import {
  Lock,
  ShieldCheck,
  Briefcase,
  Clock,
  Search,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
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
  const { bySymbol, isLive, lastUpdated } = useLiveMarket();

  // Active states
  const [selectedInstId, setSelectedInstId] = useState<string>("NIFTY");
  const [arenaMode, setArenaMode] = useState<"FUTURES" | "OPTIONS">("FUTURES");
  const [tabType, setTabType] = useState<"INDEX" | "EQUITY">("INDEX");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Floor and Risk limits
  const totalCombinedFloor = 50000;
  const currentPnl = 1598.70;
  const totalAccountCapital = 5000000;

  // Selected Instrument
  const activeInstrument = useMemo(() => {
    return INSTRUMENTS.find((i) => i.id === selectedInstId) || INSTRUMENTS[0];
  }, [selectedInstId]);

  // Live price helpers
  const getLivePrice = (sym: string, fallback: number) => {
    return bySymbol[sym]?.ltp && bySymbol[sym].ltp > 0 ? bySymbol[sym].ltp : fallback;
  };

  const getLiveChange = (sym: string) => {
    return bySymbol[sym]?.change ?? 0;
  };

  const getLivePercent = (sym: string) => {
    return bySymbol[sym]?.changePercent ?? 0;
  };

  const currentActivePrice = getLivePrice(activeInstrument.symbol, activeInstrument.defaultPrice);
  const currentActiveChange = getLiveChange(activeInstrument.symbol);
  const currentActivePercent = getLivePercent(activeInstrument.symbol);

  // SL state tied to price
  const [customSL, setCustomSL] = useState<number>(() => Math.round(currentActivePrice * 0.985));

  // Order Math Calculations
  const totalQuantity = lots * activeInstrument.lotSize;
  const marginRequired = lots * activeInstrument.spanMargin;
  const availableMarginAfter = totalAccountCapital - marginRequired;
  const plannedRisk = Math.abs(currentActivePrice - customSL) * totalQuantity;
  const isBreached = plannedRisk > totalCombinedFloor;

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Banner Shield HUD */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#151a23] border border-[#22283a] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Simultaneous F&O Shield (Locked till 12 AM)</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-white flex items-baseline gap-2">
            <span className="text-emerald-400">₹{currentPnl.toLocaleString("en-IN", { minimumFractionDigits: 1 })}</span>
            <span className="text-slate-500 text-sm font-normal">/ ₹{totalCombinedFloor.toLocaleString("en-IN")} Combined Floor</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator badge */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
            isLive
              ? "bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "bg-slate-800 border-slate-700 text-slate-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span>ANGEL ONE LIVE</span>
            {lastUpdated && <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({lastUpdated})</span>}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c2331] hover:bg-[#252f42] border border-[#2c354a] text-xs font-medium text-slate-300 transition-colors">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch Home</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c2331] hover:bg-[#252f42] border border-[#2c354a] text-xs font-medium text-slate-300 transition-colors">
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            <span>Positions (0)</span>
          </button>
        </div>
      </header>

      {/* Arena Mode Switcher */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setArenaMode("FUTURES")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md ${
            arenaMode === "FUTURES"
              ? "bg-[#f59e0b] text-slate-950 shadow-amber-500/20"
              : "bg-[#151a23] text-slate-400 hover:text-white border border-[#22283a]"
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Futures Arena Mode</span>
        </button>

        <button
          onClick={() => setArenaMode("OPTIONS")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md ${
            arenaMode === "OPTIONS"
              ? "bg-[#f59e0b] text-slate-950 shadow-amber-500/20"
              : "bg-[#151a23] text-slate-400 hover:text-white border border-[#22283a]"
          }`}
        >
          <Flame className="w-4 h-4 fill-current" />
          <span>Options Arena Mode</span>
        </button>
      </div>

      {/* Filter Tabs & Quick Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setTabType("INDEX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tabType === "INDEX" ? "bg-[#22283a] text-amber-400 border border-amber-400/30" : "bg-[#151a23] text-slate-400"
            }`}
          >
            Index F&O
          </button>
          <button
            onClick={() => setTabType("EQUITY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tabType === "EQUITY" ? "bg-[#22283a] text-amber-400 border border-amber-400/30" : "bg-[#151a23] text-slate-400"
            }`}
          >
            Equity F&O (180+)
          </button>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search F&O contracts (RELIANCE, SBIN, TCS, NIFTY)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#151a23] border border-[#22283a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>
      </div>

      {/* Live Index Ticker Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {INSTRUMENTS.map((inst) => {
          const ltp = getLivePrice(inst.symbol, inst.defaultPrice);
          const change = getLiveChange(inst.symbol);
          const isSelected = selectedInstId === inst.id;
          const isPositive = change >= 0;

          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInstId(inst.id)}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? "bg-[#182030] border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/50"
                  : "bg-[#151a23] border-[#22283a] hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-white tracking-wide">{inst.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">Lot: {inst.lotSize}</span>
              </div>
              <div className="mt-2 text-base font-extrabold text-emerald-400 font-mono flex items-baseline justify-between">
                <span>₹{ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`text-[10px] flex items-center ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {getLivePercent(inst.symbol)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Terminal View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Area: Contract Overview */}
        <div className="lg:col-span-7 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start border-b border-[#22283a] pb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-wide">{activeInstrument.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Spot: <span className="font-mono text-emerald-400">₹{currentActivePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-400 font-mono">Lot Size: {activeInstrument.lotSize} Qty</span>
                <p className="text-[11px] text-slate-400">Span/Lot: ₹{activeInstrument.spanMargin.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Contract Highlight Box */}
            <div className="my-8 py-10 px-6 rounded-2xl bg-[#0f141d] border border-[#1f2638] text-center space-y-3">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                Underlying Futures Contract
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
                {activeInstrument.symbol} CURRENT MONTH FUT
              </h3>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight animate-pulse">
                ₹{currentActivePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                <span>Net Change:</span>
                <span className={currentActiveChange >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {currentActiveChange >= 0 ? `+${currentActiveChange}` : currentActiveChange} ({currentActivePercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Safety Guard Status */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#101622] border border-[#1e273a] text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Zero-breach capital shield enabled. Orders violating maximum planned SL risk are automatically locked.</span>
          </div>
        </div>

        {/* Right Area: Order Execution Ticket */}
        <div className="lg:col-span-5 bg-[#151a23] border border-[#22283a] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#22283a] pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Order Ticket</span>
            <span className="text-sm font-black font-mono text-amber-400">₹{currentActivePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>

          {/* BUY / SELL Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderSide("BUY")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors ${
                orderSide === "BUY" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setOrderSide("SELL")}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors ${
                orderSide === "SELL" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-[#1c2331] text-slate-400"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Lots Stepper */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Lots</span>
              <span className="font-mono">Total Qty: <strong className="text-white">{totalQuantity}</strong></span>
            </div>
            <div className="flex items-center bg-[#0f141d] border border-[#22283a] rounded-xl p-1">
              <button
                onClick={() => setLots((l) => Math.max(1, l - 1))}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] hover:bg-[#252f44] text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={lots}
                onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center bg-transparent text-white font-bold font-mono text-sm focus:outline-none"
              />
              <button
                onClick={() => setLots((l) => l + 1)}
                className="w-10 h-8 flex items-center justify-center rounded-lg bg-[#1a2130] hover:bg-[#252f44] text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Entry Price & Mandatory SL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">Entry Price (₹)</label>
              <input
                type="number"
                value={currentActivePrice}
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
                value={customSL}
                onChange={(e) => setCustomSL(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-[#0f141d] border border-amber-500/40 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Risk & Margin Calculations */}
          <div className="space-y-2 pt-2 text-xs border-t border-[#22283a]">
            <div className="flex justify-between">
              <span className="text-slate-400">Capital/Margin Req:</span>
              <span className="text-white font-bold font-mono">₹{marginRequired.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Margin Remaining:</span>
              <span className="text-emerald-400 font-bold font-mono">₹{availableMarginAfter.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#22283a]">
              <span className="text-amber-400 font-semibold">Planned SL Risk:</span>
              <span className={`font-bold font-mono ${isBreached ? "text-rose-500" : "text-amber-400"}`}>
                ₹{plannedRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Order Execution Button */}
          <button
            type="button"
            disabled={isBreached}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              isBreached
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : orderSide === "BUY"
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"
            }`}
          >
            {isBreached
              ? "RISK BREACH: ORDER BLOCKED"
              : `${orderSide} ${activeInstrument.symbol} FUT (${totalQuantity} Qty)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TerminalComponent;