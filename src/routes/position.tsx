import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ChevronLeft, 
  Activity, 
  Flame, 
  Zap 
} from "lucide-react";

export const Route = createFileRoute("/position")({
  component: PositionsComponent,
});

interface Position {
  id: string;
  symbol: string;
  baseSymbol?: string;
  arena: "FUTURES" | "OPTIONS";
  orderSide: "BUY" | "SELL";
  lots: number;
  lotSize: number;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  marginUsed?: number;
  pnl: number;
  status: "OPEN" | "CLOSED";
  timestamp: string;
}

export function PositionsComponent() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [dailyLimit, setDailyLimit] = useState<number>(50000);
  const [filterMode, setFilterMode] = useState<"ALL" | "FUTURES" | "OPTIONS">("ALL");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("capitalguard_positions");
      const limit = Number(localStorage.getItem("capitalguard_daily_limit")) || 50000;
      setDailyLimit(limit);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((p) => ({
            ...p,
            arena: (p.arena || "OPTIONS").toUpperCase() as "FUTURES" | "OPTIONS",
            lots: Number(p.lots) || 1,
            lotSize: Number(p.lotSize) || 50,
            quantity: Number(p.quantity) || (Number(p.lots) || 1) * (Number(p.lotSize) || 50),
            entryPrice: Number(p.entryPrice) || 100,
            currentPrice: Number(p.currentPrice) || Number(p.entryPrice) || 100,
            stopLoss: Number(p.stopLoss) || 0,
            pnl: Number(p.pnl) || 0,
            status: (p.status === "CLOSED" ? "CLOSED" : "OPEN") as "OPEN" | "CLOSED",
          }));
          setPositions(normalized);
        }
      }
    } catch (e) {}
  }, []);

  // ⚡ Live Momentum Tick Engine
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => {
        let hasChanged = false;
        const updated = prev.map((pos) => {
          if (pos.status === "CLOSED") return pos;

          const jitterPercent = (Math.random() * 0.3 - 0.15) / 100;
          const newPrice = Number(Math.max(0.05, pos.currentPrice * (1 + jitterPercent)).toFixed(2));
          
          const qty = Number(pos.quantity) || (pos.lots * pos.lotSize) || 1;
          const pnl = Number(
            (pos.orderSide === "BUY" ? newPrice - pos.entryPrice : pos.entryPrice - newPrice) * qty
          );

          const slTriggered = pos.orderSide === "BUY" ? newPrice <= pos.stopLoss : newPrice >= pos.stopLoss;

          hasChanged = true;
          return {
            ...pos,
            currentPrice: newPrice,
            pnl: Number(pnl.toFixed(2)),
            status: (slTriggered ? "CLOSED" : pos.status) as "OPEN" | "CLOSED",
          };
        });

        if (hasChanged) {
          try {
            localStorage.setItem("capitalguard_positions", JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const filteredPositions = positions.filter((p) => {
    if (filterMode === "ALL") return true;
    return p.arena === filterMode;
  });

  const openPositions = filteredPositions.filter((p) => p.status === "OPEN");
  const closedPositions = filteredPositions.filter((p) => p.status === "CLOSED");

  // Combined calculations across ALL positions
  const totalUnrealized = positions.filter(p => p.status === "OPEN").reduce((acc, p) => acc + (Number(p.pnl) || 0), 0);
  const totalRealized = positions.filter(p => p.status === "CLOSED").reduce((acc, p) => acc + (Number(p.pnl) || 0), 0);
  const combinedNetPnL = totalUnrealized + totalRealized;

  const handleSquareOff = (id: string) => {
    const updated = positions.map((p) => (p.id === id ? { ...p, status: "CLOSED" as const } : p));
    setPositions(updated);
    localStorage.setItem("capitalguard_positions", JSON.stringify(updated));
  };

  const handleSquareOffAll = () => {
    const updated = positions.map((p) => ({ ...p, status: "CLOSED" as const }));
    setPositions(updated);
    localStorage.setItem("capitalguard_positions", JSON.stringify(updated));
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/terminal"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A23] border border-[#222B3A] text-xs font-bold text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Terminal</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>UNIFIED TICK ENGINE</span>
          </div>
        </div>
      </div>

      {/* Hero Combined PnL Banner */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-6 text-center shadow-xl space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          COMBINED F&amp;O PROFIT &amp; LOSS (SIMULTANEOUS BOOK)
        </span>
        <div className={`text-3xl sm:text-4xl font-mono font-black ${combinedNetPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {combinedNetPnL >= 0 ? `+₹${combinedNetPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-₹${Math.abs(combinedNetPnL).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
        <div className="flex justify-center gap-6 text-xs font-mono text-slate-400 pt-1">
          <span>Realized: <b className={totalRealized >= 0 ? "text-emerald-400" : "text-rose-400"}>₹{totalRealized.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</b></span>
          <span>•</span>
          <span>Unrealized: <b className={totalUnrealized >= 0 ? "text-emerald-400" : "text-rose-400"}>₹{totalUnrealized.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</b></span>
        </div>
      </div>

      {/* Filter Tabs: ALL, FUTURES, OPTIONS */}
      <div className="flex items-center gap-2 bg-[#151A23] p-1 rounded-xl border border-[#222B3A] w-fit">
        <button
          onClick={() => setFilterMode("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterMode === "ALL" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
        >
          All Contracts ({positions.filter(p => p.status === "OPEN").length})
        </button>
        <button
          onClick={() => setFilterMode("FUTURES")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterMode === "FUTURES" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
        >
          Futures Only ({positions.filter(p => p.arena === "FUTURES" && p.status === "OPEN").length})
        </button>
        <button
          onClick={() => setFilterMode("OPTIONS")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterMode === "OPTIONS" ? "bg-amber-400 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
        >
          Options Only ({positions.filter(p => p.arena === "OPTIONS" && p.status === "OPEN").length})
        </button>
      </div>

      {/* Open Positions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Open Positions ({openPositions.length})
          </h2>
          {openPositions.length > 0 && (
            <button
              onClick={handleSquareOffAll}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 underline underline-offset-4"
            >
              Square Off All ({openPositions.length})
            </button>
          )}
        </div>

        {openPositions.length === 0 ? (
          <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-8 text-center text-slate-500 text-xs">
            No active open trades in this category. Place orders in the F&amp;O Terminal.
          </div>
        ) : (
          openPositions.map((pos) => (
            <div
              key={pos.id}
              className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm">{pos.symbol}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    pos.arena === "FUTURES" ? "bg-sky-500/10 text-sky-400 border border-sky-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}>
                    {pos.arena}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    pos.orderSide === "BUY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}>
                    {pos.orderSide} {pos.lots}L ({pos.quantity} Qty)
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1 space-x-3">
                  <span>Entry: <b className="text-slate-200">₹{pos.entryPrice}</b></span>
                  <span>LTP: <b className="text-amber-400">₹{pos.currentPrice}</b></span>
                  <span>SL: <b className="text-rose-400">₹{pos.stopLoss}</b></span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className={`text-base font-mono font-black ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {pos.pnl >= 0 ? `+₹${pos.pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : `-₹${Math.abs(pos.pnl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </div>
                <button
                  onClick={() => handleSquareOff(pos.id)}
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  Exit Trade
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Closed Positions History */}
      {closedPositions.length > 0 && (
        <div className="space-y-3 pt-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
            Closed Positions History ({closedPositions.length})
          </h2>
          {closedPositions.map((pos) => (
            <div
              key={pos.id}
              className="bg-[#151A23]/60 border border-[#222B3A] rounded-2xl p-3.5 flex items-center justify-between opacity-80"
            >
              <div>
                <span className="font-bold text-white text-xs">{pos.symbol} ({pos.arena})</span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Closed • Entry: ₹{pos.entryPrice} • Exit: ₹{pos.currentPrice}
                </span>
              </div>
              <div className={`text-xs font-mono font-bold ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {pos.pnl >= 0 ? `+₹${pos.pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : `-₹${Math.abs(pos.pnl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}