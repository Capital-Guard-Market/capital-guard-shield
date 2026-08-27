import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Briefcase,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/position")({
  component: UnifiedPositionsPage,
});

interface PositionItem {
  id: string;
  instrument: string;
  strike: number;
  type: "CE" | "PE" | "FUT";
  buyPrice: number;
  currentPrice: number;
  exitPrice?: number;
  qty: number;
  sl: number;
  target?: number;
  pnl: number;
  orderId: string;
  productType: "INTRADAY" | "CARRYFORWARD";
  entryTime: string;
  exitTime?: string;
  status: "OPEN" | "CLOSED";
  date: string; // YYYY-MM-DD (IST)
}

function UnifiedPositionsPage() {
  const [filter, setFilter] = useState<"ALL" | "FUTURES" | "OPTIONS">("ALL");
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [realizedPnL, setRealizedPnL] = useState<number>(0);
  const [currentIstDate, setCurrentIstDate] = useState<string>("");

  // Get Current IST Date (YYYY-MM-DD)
  const getTodayIST = () => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  };

  // --- IST MIDNIGHT AUTO-RESET & SYNC ENGINE ---
  const syncAndCheckMidnightRollover = () => {
    try {
      const today = getTodayIST();
      setCurrentIstDate(today);

      const savedPosRaw = localStorage.getItem("capitalguard_positions");
      const savedDate = localStorage.getItem("capitalguard_last_session_date");

      let allPositions: PositionItem[] = savedPosRaw ? JSON.parse(savedPosRaw) : [];

      // MIDNIGHT CHECK: If the date has changed in IST
      if (savedDate && savedDate !== today) {
        // 1. Separate yesterday's closed trades from open carryforward trades
        const yesterdayClosed = allPositions.filter(
          (p) => p.date !== today && p.status === "CLOSED"
        );
        const carryforwardOpen = allPositions.filter(
          (p) => p.status === "OPEN" && p.productType === "CARRYFORWARD"
        );

        // 2. Archive closed trades to Trade Journal permanently
        if (yesterdayClosed.length > 0) {
          const existingArchive = JSON.parse(
            localStorage.getItem("capitalguard_journal_archive") || "[]"
          );
          const updatedArchive = [...yesterdayClosed, ...existingArchive];
          localStorage.setItem("capitalguard_journal_archive", JSON.stringify(updatedArchive));
        }

        // 3. Reset Intraday Book: Keep only open carryforward positions
        allPositions = carryforwardOpen.map((p) => ({
          ...p,
          date: today, // Roll date to today
        }));

        localStorage.setItem("capitalguard_positions", JSON.stringify(allPositions));
        localStorage.setItem("capitalguard_last_session_date", today);
        setRealizedPnL(0);
      } else {
        if (!savedDate) {
          localStorage.setItem("capitalguard_last_session_date", today);
        }

        // Calculate Realized PnL strictly for TODAY'S session
        const todayRealized = allPositions
          .filter((p) => p.date === today && p.status === "CLOSED")
          .reduce((sum, p) => sum + p.pnl, 0);

        setRealizedPnL(todayRealized);
      }

      setPositions(allPositions);
    } catch (e) {
      console.error("Position Engine Sync Error:", e);
    }
  };

  useEffect(() => {
    syncAndCheckMidnightRollover();
    // Check rollover every 5 seconds
    const interval = setInterval(syncAndCheckMidnightRollover, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- LIVE TICKS SIMULATION FOR OPEN POSITIONS ---
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          if (pos.status !== "OPEN") return pos;

          // Subtle tick delta
          const delta = (Math.random() - 0.48) * 0.75;
          const updatedPrice = Math.max(1, Number((pos.currentPrice + delta).toFixed(2)));
          const updatedPnl = Number(((updatedPrice - pos.buyPrice) * pos.qty).toFixed(2));

          // Auto Stop-Loss Trigger at -20% Hard SL floor
          if (updatedPrice <= pos.sl) {
            return {
              ...pos,
              currentPrice: updatedPrice,
              exitPrice: updatedPrice,
              pnl: updatedPnl,
              status: "CLOSED",
              exitTime: new Date().toLocaleTimeString("en-IN"),
            };
          }

          return {
            ...pos,
            currentPrice: updatedPrice,
            pnl: updatedPnl,
          };
        })
      );
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  // 1-Click Square Off Handler
  const handleSquareOff = (id: string) => {
    const updated = positions.map((pos) => {
      if (pos.id === id && pos.status === "OPEN") {
        return {
          ...pos,
          status: "CLOSED" as const,
          exitPrice: pos.currentPrice,
          exitTime: new Date().toLocaleTimeString("en-IN"),
        };
      }
      return pos;
    });

    setPositions(updated);
    localStorage.setItem("capitalguard_positions", JSON.stringify(updated));

    const today = getTodayIST();
    const newRealized = updated
      .filter((p) => p.date === today && p.status === "CLOSED")
      .reduce((sum, p) => sum + p.pnl, 0);

    setRealizedPnL(newRealized);
  };

  // Filtered lists
  const openPositions = positions.filter((p) => {
    if (p.status !== "OPEN") return false;
    if (filter === "FUTURES") return p.type === "FUT";
    if (filter === "OPTIONS") return p.type === "CE" || p.type === "PE";
    return true;
  });

  const closedPositions = positions.filter((p) => {
    if (p.status !== "CLOSED") return false;
    if (filter === "FUTURES") return p.type === "FUT";
    if (filter === "OPTIONS") return p.type === "CE" || p.type === "PE";
    return true;
  });

  const unrealizedPnL = openPositions.reduce((sum, p) => sum + p.pnl, 0);
  const totalBookPnL = realizedPnL + unrealizedPnL;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-400" /> Unified Positions Book
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-asset derivatives book. Intraday metrics reset daily at 12:00:00 AM IST.
          </p>
        </div>

        <Link
          to="/arena"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
        >
          <Zap className="w-3.5 h-3.5" /> F&O Arena
        </Link>
      </div>

      {/* TOTAL COMBINED P&L BANNER */}
      <div className="p-6 rounded-2xl bg-[#0c111c] border border-[#1a2336] text-center space-y-3">
        <div className="text-[11px] uppercase font-black tracking-widest text-slate-400">
          Combined F&O Session Profit & Loss (IST Book)
        </div>
        <div
          className={`text-3xl md:text-4xl font-black tracking-tight font-mono ${
            totalBookPnL >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {totalBookPnL >= 0 ? `+₹${totalBookPnL.toFixed(2)}` : `-₹${Math.abs(totalBookPnL).toFixed(2)}`}
        </div>
        <div className="flex justify-center items-center gap-6 text-xs text-slate-400 pt-1">
          <div>
            Realized (Today):{" "}
            <strong className={realizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}>
              {realizedPnL >= 0 ? `+₹${realizedPnL.toFixed(2)}` : `-₹${Math.abs(realizedPnL).toFixed(2)}`}
            </strong>
          </div>
          <span className="text-slate-600">•</span>
          <div>
            Unrealized:{" "}
            <strong className={unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}>
              {unrealizedPnL >= 0 ? `+₹${unrealizedPnL.toFixed(2)}` : `-₹${Math.abs(unrealizedPnL).toFixed(2)}`}
            </strong>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 border-b border-[#182133] pb-3">
        {[
          { key: "ALL", label: `All Contracts (${positions.length})` },
          { key: "OPTIONS", label: `Options Only (${positions.filter((p) => p.type !== "FUT").length})` },
          { key: "FUTURES", label: `Futures Only (${positions.filter((p) => p.type === "FUT").length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
              filter === key
                ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                : "bg-[#101724] text-slate-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SECTION 1: LIVE OPEN POSITIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Open Live Positions ({openPositions.length})
          </h2>
          <span className="text-[10px] text-amber-400 font-bold">20% Hard-SL Auto Enforced</span>
        </div>

        {openPositions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c111c] border border-[#1a2336] text-center text-xs text-slate-500">
            No active open trades in this category. Place orders in the F&O Terminal.
          </div>
        ) : (
          <div className="grid gap-3">
            {openPositions.map((pos) => (
              <div
                key={pos.id}
                className="p-4 rounded-xl bg-[#0c111c] border border-[#1d273a] hover:border-slate-600 transition-all flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">
                      {pos.instrument} {pos.strike} {pos.type}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                        pos.productType === "CARRYFORWARD"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {pos.productType === "CARRYFORWARD" ? "NRML" : "MIS"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({pos.qty} Qty)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Entry: <strong className="text-white">₹{pos.buyPrice}</strong></span>
                    <span>LTP: <strong className="text-amber-400">₹{pos.currentPrice}</strong></span>
                    <span>Stop-Loss: <strong className="text-red-400">₹{pos.sl} (-20%)</strong></span>
                    {pos.target && <span>Target: <strong className="text-emerald-400">₹{pos.target}</strong></span>}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Floating P&L</div>
                    <div
                      className={`text-base font-black font-mono ${
                        pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {pos.pnl >= 0 ? `+₹${pos.pnl.toFixed(2)}` : `-₹${Math.abs(pos.pnl).toFixed(2)}`}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSquareOff(pos.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white text-xs font-black transition-all border border-red-500/30"
                  >
                    Square Off
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: TODAY'S CLOSED POSITIONS */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            Today's Closed Trades ({closedPositions.length})
          </h2>
          <span className="text-[10px] text-slate-500 font-bold">Resets at 12:00 AM IST</span>
        </div>

        {closedPositions.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#090d14] border border-[#141b29] text-center text-xs text-slate-500">
            No closed positions yet today.
          </div>
        ) : (
          <div className="grid gap-2">
            {closedPositions.map((pos) => (
              <div
                key={pos.id}
                className="p-3.5 rounded-xl bg-[#090d14] border border-[#161f30] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">
                    {pos.instrument} {pos.strike} {pos.type} ({pos.qty} Qty)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Entry: ₹{pos.buyPrice} • Exit: ₹{pos.exitPrice} • {pos.exitTime}
                  </div>
                </div>

                <div
                  className={`font-black font-mono text-sm ${
                    pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {pos.pnl >= 0 ? `+₹${pos.pnl.toFixed(2)}` : `-₹${Math.abs(pos.pnl).toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedPositionsPage;