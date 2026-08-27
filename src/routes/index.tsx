import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, TrendingUp, Zap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: GatewayPage,
});

function GatewayPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5" /> Capital Guard Shield
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Select Your Execution Realm
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
          Disciplined capital preservation with unbreachable risk rules and zero-emotional execution.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 pt-4">
        {/* Equity Card */}
        <div className="p-6 rounded-2xl bg-[#0e131d] border border-[#1e2638] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Equity Investments</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Cash delivery holding (CNC) across NSE & BSE with non-leveraged long-term capital allocation.
              </p>
            </div>
          </div>
          <Link
            to="/equity"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <span>Enter Investment Realm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* F&O Derivatives Card */}
        <div className="p-6 rounded-2xl bg-[#0e131d] border border-[#1e2638] hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">F&O Derivatives Realm</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Futures & Options trading backed by unbreachable 5%, 10%, 20% stop-loss math and rolling circuits.
              </p>
            </div>
          </div>
          <Link
            to="/arena"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            <span>Enter F&O Arena</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default GatewayPage;