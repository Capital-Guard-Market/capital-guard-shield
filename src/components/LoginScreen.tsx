import React, { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export function LoginScreen() {
  const { login } = useSession();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || "trader@capitalguard.io");
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#151A23] border border-[#222B3A] rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">CapitalGuard</h1>
          <p className="text-xs text-slate-400">Institutional F&amp;O Risk-Controlled Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Trader Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="trader@capitalguard.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#222B3A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
          >
            <span>Access Guarded Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Unbreachable 12:00 AM Risk Guardrails Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}