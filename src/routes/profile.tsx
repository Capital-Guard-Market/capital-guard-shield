import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  User, 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  Award, 
  TrendingUp, 
  Play, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/profile")({
  component: ProfileComponent,
});

export function ProfileComponent() {
  const navigate = useNavigate();
  const { user, logout } = useSession();

  const [arena, setArena] = useState("options");
  const [dailyLimit, setDailyLimit] = useState(5000);
  const [disciplineScore, setDisciplineScore] = useState(98);
  const [streakDays, setStreakDays] = useState(14);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedArena = localStorage.getItem("capitalguard_arena") || "options";
      const savedLimit = Number(localStorage.getItem("capitalguard_daily_limit")) || (savedArena === "futures" ? 250000 : 5000);
      setArena(savedArena);
      setDailyLimit(savedLimit);
    } catch (e) {}
  }, []);

  const handleReplayIntro = () => {
    sessionStorage.removeItem("capitalguard_splash_seen");
    window.location.reload();
  };

  const handleEmergencyResetDay = () => {
    localStorage.removeItem("capitalguard_lock_date");
    localStorage.removeItem("capitalguard_positions");
    localStorage.removeItem("capitalguard_arena");
    localStorage.removeItem("capitalguard_daily_limit");
    setMessage("Guardrail reset complete. Redirecting to Arena Gate...");
    setTimeout(() => navigate({ to: "/arena" }), 800);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
            {user?.name?.[0]?.toUpperCase() || "T"}
          </div>
          <div>
            <h1 className="text-lg font-black text-white">{user?.name || "Pro Trader"}</h1>
            <p className="text-xs text-slate-400 font-mono">{user?.email || "trader@capitalguard.io"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRO VERIFIED
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 capitalize">
                {arena} Arena
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleReplayIntro}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3A] text-xs font-bold text-slate-300 hover:text-white transition shadow-md"
        >
          <Play className="w-4 h-4 text-amber-400" />
          <span>Replay 12s Intro Video</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold p-3 rounded-xl text-center">
          {message}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discipline Score</span>
          <div className="text-2xl font-mono font-black text-emerald-400">{disciplineScore}%</div>
          <p className="text-[10px] text-slate-500">Zero unmanaged drawdown</p>
        </div>

        <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shielded Streak</span>
          <div className="text-2xl font-mono font-black text-amber-400">{streakDays} Days</div>
          <p className="text-[10px] text-slate-500">Strict SL adherence</p>
        </div>

        <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locked Daily Loss</span>
          <div className="text-2xl font-mono font-black text-rose-400">₹{dailyLimit.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-500">Locked till 12:00 AM</p>
        </div>
      </div>

      {/* Account Control Actions */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Risk System Controls</h2>

        <div className="space-y-2">
          <button
            onClick={() => navigate({ to: "/arena" })}
            className="w-full p-3.5 rounded-xl bg-[#0B0E14] border border-[#222B3A] flex items-center justify-between hover:border-slate-700 transition text-left"
          >
            <div>
              <span className="text-xs font-bold text-white block">Switch Trading Arena &amp; Floor</span>
              <span className="text-[10px] text-slate-500">Change between Options Arena and Futures Arena</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={handleEmergencyResetDay}
            className="w-full p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between hover:bg-rose-500/20 transition text-left"
          >
            <div>
              <span className="text-xs font-bold text-rose-300 block">Reset Guardrail &amp; Clear Storage</span>
              <span className="text-[10px] text-rose-400/80">Clear positions and re-lock fresh daily guardrails</span>
            </div>
            <RotateCcw className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>
    </div>
  );
}