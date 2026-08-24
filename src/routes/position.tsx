import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Layers, 
  Zap, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  User,
  Activity
} from "lucide-react";

export const Route = createFileRoute("/position")({
  head: () => ({
    meta: [{ title: "Positions & Post-Mortem 🛡️ CapitalGuard" }],
  }),
  component: PositionsDashboard,
});

export function PositionsDashboard() {
  const navigate = useNavigate();

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

  const [selectedPostMortem, setSelectedPostMortem] = useState<any | null>(null);

  // Live Price Ticking Engine
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
      postMortem: {
        disciplineScore: realizedPnL >= 0 ? 95 : 80,
        slAdherence: "Hard Stop Respected",
        emotionTag: realizedPnL >= 0 ? "Disciplined Execution" : "Controlled Loss",
      },
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
        postMortem: {
          disciplineScore: 85,
          slAdherence: "Manual Square Off",
          emotionTag: "Bulk Exit",
        },
      };
    });

    const nextClosed = [...newlyClosed, ...closedPositions];
    setOpenPositions([]);
    setClosedPositions(nextClosed);

    localStorage.setItem("capitalguard_positions", JSON.stringify([]));
    localStorage.setItem("capitalguard_closed_positions", JSON.stringify(nextClosed));
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
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222B3A]">
          <Link to="/terminal" className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Link
              to="/profile"
              className="flex items-center space-x-1 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white"
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Journal</span>
            </Link>
          </div>
        </div>

        {/* TODAY'S NET PROFIT / LOSS BANNER (TOP PROMINENT) */}
        <div className="p-6 bg-gradient-to-r from-[#151A23] via-[#1A202C] to-[#151A23] border border-[#222B3A] rounded-2xl text-center shadow-xl">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Today's Net Profit & Loss</span>
          <div className={`text-4xl font-extrabold font-mono mt-2 transition-colors ${totalDayPnL >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
            {totalDayPnL >= 0 ? "+" : ""}₹{totalDayPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-3 text-xs text-slate-400 font-mono">
            <span>Realized: <strong className={totalRealizedDay >= 0 ? "text-emerald-400" : "text-rose-400"}>₹{totalRealizedDay.toFixed(2)}</strong></span>
            <span>•</span>
            <span>Unrealized: <strong className={totalUnrealizedDay >= 0 ? "text-emerald-400" : "text-rose-400"}>₹{totalUnrealizedDay.toFixed(2)}</strong></span>
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
                    <h3 className="text-sm font-bold text-white">Options Positions</h3>
                    <p className="text-[10px] text-slate-400">{openOptions.length} Active • {closedOptions.length} Closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Options Net</span>
                  <span className={`text-base font-bold font-mono ${optionsTotalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {optionsTotalPnL >= 0 ? "+" : ""}₹{optionsTotalPnL.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Open Options */}
              {openOptions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Option Contracts</span>
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
                            {pos.quantity} Qty • Entry: ₹{pos.entryPrice.toFixed(1)} • LTP: ₹{pos.currentPrice.toFixed(1)} • Hard SL: ₹{pos.stopLoss}
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
                            Exit Trade
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Closed Options */}
              {closedOptions.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Closed Option Trades</span>
                  {closedOptions.map((pos, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-300">{pos.symbol}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">Exit @ ₹{pos.exitPrice?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono font-bold ${pos.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {pos.realizedPnL >= 0 ? "+" : ""}₹{pos.realizedPnL.toFixed(2)}
                        </span>
                        <button
                          onClick={() => setSelectedPostMortem(pos)}
                          className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded text-[10px] font-bold hover:bg-amber-400/20"
                        >
                          Post-Mortem
                        </button>
                      </div>
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
                    <h3 className="text-sm font-bold text-white">Futures Positions</h3>
                    <p className="text-[10px] text-slate-400">{openFutures.length} Active • {closedFutures.length} Closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Futures Net</span>
                  <span className={`text-base font-bold font-mono ${futuresTotalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {futuresTotalPnL >= 0 ? "+" : ""}₹{futuresTotalPnL.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Open Futures */}
              {openFutures.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Futures Contracts</span>
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
                            {pos.quantity} Qty • Entry: ₹{pos.entryPrice.toFixed(1)} • LTP: ₹{pos.currentPrice.toFixed(1)} • Hard SL: ₹{pos.stopLoss}
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
                            Exit Trade
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Closed Futures */}
              {closedFutures.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Closed Futures Trades</span>
                  {closedFutures.map((pos, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-300">{pos.symbol}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">Exit @ ₹{pos.exitPrice?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono font-bold ${pos.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {pos.realizedPnL >= 0 ? "+" : ""}₹{pos.realizedPnL.toFixed(2)}
                        </span>
                        <button
                          onClick={() => setSelectedPostMortem(pos)}
                          className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded text-[10px] font-bold hover:bg-amber-400/20"
                        >
                          Post-Mortem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Square Off Master Button */}
            {openPositions.length > 0 && (
              <button
                onClick={handleSquareOffAll}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]"
              >
                SQUARE OFF ALL OPEN POSITIONS ({openPositions.length})
              </button>
            )}
          </>
        )}

        {/* POST-MORTEM ANALYSIS MODAL / DRAWER */}
        {selectedPostMortem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Post-Mortem Trade Analysis</h3>
                </div>
                <button
                  onClick={() => setSelectedPostMortem(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-white">{selectedPostMortem.symbol}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Entry: ₹{selectedPostMortem.entryPrice} • Exit: ₹{selectedPostMortem.exitPrice} • Net P&L:{" "}
                  <span className={selectedPostMortem.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    ₹{selectedPostMortem.realizedPnL?.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Discipline Score</span>
                  <span className="font-bold text-emerald-400">{selectedPostMortem.postMortem?.disciplineScore || 90} / 100</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Stop-Loss Adherence</span>
                  <span className="font-bold text-slate-200">{selectedPostMortem.postMortem?.slAdherence || "Respected"}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Psychology Tag</span>
                  <span className="font-bold text-amber-400">{selectedPostMortem.postMortem?.emotionTag || "Rule Follower"}</span>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Key AI Behavioral Takeaway</span>
                  <p className="text-[11px] text-slate-300">
                    {selectedPostMortem.realizedPnL >= 0
                      ? "Trade was executed with predefined risk-to-reward parameters. Good job letting the strategy play out without impulsive tweaks."
                      : "Loss was kept strictly within the guardrail limit. Capital protection was successfully preserved."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPostMortem(null)}
                className="w-full py-2.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:brightness-110"
              >
                Close Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}