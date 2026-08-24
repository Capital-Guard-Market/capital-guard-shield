import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { ShieldCheck, ArrowLeft, TrendingUp, TrendingDown, Layers, Zap, Trash2, CheckCircle2 } from "lucide-react";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/position")({
  head: () => ({
    meta: [{ title: "Portfolio Positions & Day P&L 🛡️ CapitalGuard" }],
  }),
  component: PositionsDashboard,
});

export function PositionsDashboard() {
  const navigate = useNavigate();
  const session = useSession();

  const [openPositions, setOpenPositions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("capitalguard_positions");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [closedPositions, setClosedPositions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("capitalguard_closed_positions");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (openPositions.length === 0) return;

    const interval = setInterval(() => {
      setOpenPositions((prev) =>
        prev.map((pos) => {
          const delta = (Math.random() - 0.48) * (pos.currentPrice * 0.008);
          const nextPrice = Math.max(0.5, Number((pos.currentPrice + delta).toFixed(2)));
          return { ...pos, currentPrice: nextPrice };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [openPositions.length]);

  const handleSquareOffSingle = (id: string) => {
    const target = openPositions.find((p) => p.id === id);
    if (!target) return;

    const realizedPnL =
      target.type === "BUY"
        ? (target.currentPrice - target.entryPrice) * target.quantity
        : (target.entryPrice - target.currentPrice) * target.quantity;

    const closedItem = {
      ...target,
      exitPrice: target.currentPrice,
      realizedPnL,
      exitTimestamp: new Date().toLocaleTimeString(),
    };

    const nextOpen = openPositions.filter((p) => p.id !== id);
    const nextClosed = [closedItem, ...closedPositions];

    setOpenPositions(nextOpen);
    setClosedPositions(nextClosed);

    localStorage.setItem("capitalguard_positions", JSON.stringify(nextOpen));
    localStorage.setItem("capitalguard_closed_positions", JSON.stringify(nextClosed));
  };

  const handleSquareOffAll = () => {
    if (openPositions.length === 0) return;

    const newlyClosed = openPositions.map((pos) => {
      const realizedPnL =
        pos.type === "BUY"
          ? (pos.currentPrice - pos.entryPrice) * pos.quantity
          : (pos.entryPrice - pos.currentPrice) * pos.quantity;
      return {
        ...pos,
        exitPrice: pos.currentPrice,
        realizedPnL,
        exitTimestamp: new Date().toLocaleTimeString(),
      };
    });

    const nextClosed = [...newlyClosed, ...closedPositions];
    setOpenPositions([]);
    setClosedPositions(nextClosed);

    localStorage.setItem("capitalguard_positions", JSON.stringify([]));
    localStorage.setItem("capitalguard_closed_positions", JSON.stringify(nextClosed));
  };

  const handleResetHistory = () => {
    setClosedPositions([]);
    localStorage.removeItem("capitalguard_closed_positions");
  };

  const openOptions = openPositions.filter((p) => p.arena !== "futures");
  const closedOptions = closedPositions.filter((p) => p.arena !== "futures");

  const openFutures = openPositions.filter((p) => p.arena === "futures");
  const closedFutures = closedPositions.filter((p) => p.arena === "futures");

  const calculateOpenPnL = (list: any[]) =>
    list.reduce((acc, p) => {
      const pnl = p.type === "BUY" ? (p.currentPrice - p.entryPrice) * p.quantity : (p.entryPrice - p.currentPrice) * p.quantity;
      return acc + pnl;
    }, 0);

  const calculateClosedPnL = (list: any[]) =>
    list.reduce((acc, p) => acc + (p.realizedPnL || 0), 0);

  const optionsUnrealized = calculateOpenPnL(openOptions);
  const optionsRealized = calculateClosedPnL(closedOptions);
  const optionsTotalPnL = optionsUnrealized + optionsRealized;

  const futuresUnrealized = calculateOpenPnL(openFutures);
  const futuresRealized = calculateClosedPnL(closedFutures);
  const futuresTotalPnL = futuresUnrealized + futuresRealized;

  const totalDayPnL = optionsTotalPnL + futuresTotalPnL;
  const totalRealizedDay = optionsRealized + futuresRealized;
  const totalUnrealizedDay = optionsUnrealized + futuresUnrealized;

  const hasAnyTrade = openPositions.length > 0 || closedPositions.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 sm:p-6 pb-28">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222B3A]">
          <Link to="/terminal" className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Shield Active</span>
            </div>
            {closedPositions.length > 0 && (
              <button
                onClick={handleResetHistory}
                className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition-colors"
                title="Reset Closed Trade History"
              >
                Clear Closed
              </button>
            )}
          </div>
        </div>

        {!hasAnyTrade ? (
          <div className="text-center py-16 bg-[#151A23] border border-[#222B3A] rounded-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">No Trades Placed Today</h3>
            <p className="text-slate-400 text-xs mb-4">Execute Option or Future contracts in the terminal to view positions and Day P&L.</p>
            <Link to="/terminal" className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:brightness-110">
              Open Terminal →
            </Link>
          </div>
        ) : (
          <>
            {/* SECTION 1: OPTIONS POSITIONS */}
            <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#222B3A] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Options Portfolio</h3>
                    <p className="text-[10px] text-slate-400">{openOptions.length} Open • {closedOptions.length} Closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Options Net P&L</span>
                  <span className={`text-base font-bold font-mono ${optionsTotalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {optionsTotalPnL >= 0 ? "+" : ""}₹{optionsTotalPnL.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Open Options List */}
              {openOptions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Open Positions</span>
                  {openOptions.map((pos) => {
                    const pnl = pos.type === "BUY" ? (pos.currentPrice - pos.entryPrice) * pos.quantity : (pos.entryPrice - pos.currentPrice) * pos.quantity;
                    return (
                      <div key={pos.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{pos.symbol}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${pos.type === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                              {pos.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {pos.quantity} Qty • Entry: ₹{pos.entryPrice.toFixed(1)} • LTP: ₹{pos.currentPrice.toFixed(1)} • SL: ₹{pos.stopLoss}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-bold font-mono ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleSquareOffSingle(pos.id)}
                            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Exit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Closed Options List */}
              {closedOptions.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Closed Trades (Realized)</span>
                  {closedOptions.map((pos, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-300">{pos.symbol}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">Exit @ ₹{pos.exitPrice?.toFixed(1)} ({pos.exitTimestamp})</span>
                      </div>
                      <span className={`font-mono font-bold ${pos.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {pos.realizedPnL >= 0 ? "+" : ""}₹{pos.realizedPnL.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: FUTURES POSITIONS */}
            <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#222B3A] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-cyan-400/10 text-cyan-400 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Futures Portfolio</h3>
                    <p className="text-[10px] text-slate-400">{openFutures.length} Open • {closedFutures.length} Closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Futures Net P&L</span>
                  <span className={`text-base font-bold font-mono ${futuresTotalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {futuresTotalPnL >= 0 ? "+" : ""}₹{futuresTotalPnL.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Open Futures List */}
              {openFutures.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Open Positions</span>
                  {openFutures.map((pos) => {
                    const pnl = pos.type === "BUY" ? (pos.currentPrice - pos.entryPrice) * pos.quantity : (pos.entryPrice - pos.currentPrice) * pos.quantity;
                    return (
                      <div key={pos.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{pos.symbol}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${pos.type === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                              {pos.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {pos.quantity} Qty • Entry: ₹{pos.entryPrice.toFixed(1)} • LTP: ₹{pos.currentPrice.toFixed(1)} • SL: ₹{pos.stopLoss}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-bold font-mono ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleSquareOffSingle(pos.id)}
                            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Exit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Closed Futures List */}
              {closedFutures.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Closed Trades (Realized)</span>
                  {closedFutures.map((pos, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-300">{pos.symbol}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">Exit @ ₹{pos.exitPrice?.toFixed(1)} ({pos.exitTimestamp})</span>
                      </div>
                      <span className={`font-mono font-bold ${pos.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {pos.realizedPnL >= 0 ? "+" : ""}₹{pos.realizedPnL.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: OVERALL DAY P&L SUMMARY (AT BOTTOM) */}
            <div className="p-5 bg-gradient-to-br from-[#151A23] to-[#1c2330] border-2 border-[#222B3A] rounded-2xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">TOTAL COMBINED DAY SUMMARY</span>
                <span className="text-[10px] text-slate-400 font-mono">Realized + Unrealized</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Realized P&L</span>
                  <span className={`text-sm sm:text-base font-bold font-mono ${totalRealizedDay >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {totalRealizedDay >= 0 ? "+" : ""}₹{totalRealizedDay.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Unrealized P&L</span>
                  <span className={`text-sm sm:text-base font-bold font-mono ${totalUnrealizedDay >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {totalUnrealizedDay >= 0 ? "+" : ""}₹{totalUnrealizedDay.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Net Day P&L</span>
                  <span className={`text-base sm:text-lg font-extrabold font-mono ${totalDayPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {totalDayPnL >= 0 ? "+" : ""}₹{totalDayPnL.toFixed(2)}
                  </span>
                </div>
              </div>

              {openPositions.length > 0 && (
                <button
                  onClick={handleSquareOffAll}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]"
                >
                  SQUARE OFF ALL OPEN POSITIONS ({openPositions.length})
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}