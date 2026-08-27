import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookOpen, Calendar, CheckCircle2, TrendingUp, TrendingDown, Archive } from "lucide-react";

export const Route = createFileRoute("/journal")({
  component: TradeJournalPage,
});

function TradeJournalPage() {
  const [archivedTrades, setArchivedTrades] = useState<any[]>([]);

  useEffect(() => {
    try {
      const archive = JSON.parse(localStorage.getItem("capitalguard_journal_archive") || "[]");
      const current = JSON.parse(localStorage.getItem("capitalguard_positions") || "[]");
      const closedToday = current.filter((p: any) => p.status === "CLOSED");

      // Combine historical archive with today's closed trades
      setArchivedTrades([...closedToday, ...archive]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const totalArchivedPnL = archivedTrades.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const winningTrades = archivedTrades.filter((p) => p.pnl > 0).length;
  const winRate = archivedTrades.length > 0 ? ((winningTrades / archivedTrades.length) * 100).toFixed(0) : "0";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" /> Trade Journal & Archive
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Permanent record of all completed F&O trading sessions.
          </p>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0c111c] border border-[#1a2336]">
          <div className="text-[10px] uppercase font-bold text-slate-400">Lifetime Realized P&L</div>
          <div className={`text-xl font-black font-mono mt-1 ${totalArchivedPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalArchivedPnL >= 0 ? `+₹${totalArchivedPnL.toFixed(2)}` : `-₹${Math.abs(totalArchivedPnL).toFixed(2)}`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c111c] border border-[#1a2336]">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Executed Trades</div>
          <div className="text-xl font-black text-white font-mono mt-1">{archivedTrades.length} Trades</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c111c] border border-[#1a2336]">
          <div className="text-[10px] uppercase font-bold text-slate-400">Win Rate</div>
          <div className="text-xl font-black text-purple-400 font-mono mt-1">{winRate}%</div>
        </div>
      </div>

      {/* ARCHIVE LOG */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Archive className="w-4 h-4 text-purple-400" /> Historical Session Logs
        </h2>

        {archivedTrades.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c111c] border border-[#1a2336] text-center text-xs text-slate-500">
            No archived trades found. Completed trades will be preserved here across sessions.
          </div>
        ) : (
          <div className="divide-y divide-[#141b29] rounded-2xl bg-[#0c111c] border border-[#1a2336] overflow-hidden">
            {archivedTrades.map((trade, idx) => (
              <div key={trade.id || idx} className="p-4 flex items-center justify-between text-xs hover:bg-[#0f1522] transition-colors">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{trade.instrument} {trade.strike} {trade.type}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{trade.productType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({trade.qty} Qty)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Date: {trade.date || "Today"} • Entry: ₹{trade.buyPrice} • Exit: ₹{trade.exitPrice || trade.currentPrice}
                  </div>
                </div>

                <div className={`font-black font-mono text-sm ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {trade.pnl >= 0 ? `+₹${trade.pnl.toFixed(2)}` : `-₹${Math.abs(trade.pnl).toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TradeJournalPage;