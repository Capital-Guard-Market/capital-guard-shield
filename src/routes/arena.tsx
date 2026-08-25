import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, TrendingUp, Zap, Lock, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/arena")({
  component: ArenaComponent,
});

const FUTURES_CAPITAL = 5000000; // ₹50,00,000 Base

const OPTIONS_TIERS = [
  { label: "₹5,000", title: "Conservative", value: 5000 },
  { label: "₹10,000", title: "Moderate", value: 10000 },
  { label: "₹20,000", title: "Aggressive", value: 20000 },
];

const FUTURES_TIERS = [
  { label: "5%", title: "₹2,50,000 Risk Floor", value: 250000 },
  { label: "10%", title: "₹5,00,000 Risk Floor", value: 500000 },
  { label: "20%", title: "₹10,00,000 Risk Floor", value: 1000000 },
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function ArenaComponent() {
  const navigate = useNavigate();
  const todayKey = getTodayKey();

  const [arena, setArena] = useState<"options" | "futures">("options");
  const [selectedLimit, setSelectedLimit] = useState<number>(5000);
  const [isLockedToday, setIsLockedToday] = useState<boolean>(false);
  const [lockedLimit, setLockedLimit] = useState<number>(5000);
  const [lockedArena, setLockedArena] = useState<string>("options");

  useEffect(() => {
    try {
      const lockDate = localStorage.getItem("capitalguard_lock_date");
      const savedLimit = Number(localStorage.getItem("capitalguard_daily_limit"));
      const savedArena = localStorage.getItem("capitalguard_arena") || "options";

      if (lockDate === todayKey && savedLimit) {
        setIsLockedToday(true);
        setLockedLimit(savedLimit);
        setLockedArena(savedArena);
        setArena(savedArena as "options" | "futures");
      }
    } catch (e) {}
  }, [todayKey]);

  const handleSelectArena = (chosenArena: "options" | "futures") => {
    if (isLockedToday) return;
    setArena(chosenArena);
    setSelectedLimit(chosenArena === "options" ? 5000 : 250000);
  };

  const handleCommitDailyLock = () => {
    localStorage.setItem("capitalguard_lock_date", todayKey);
    localStorage.setItem("capitalguard_arena", arena);
    localStorage.setItem("capitalguard_daily_limit", selectedLimit.toString());
    navigate({ to: "/terminal" });
  };

  const activeTiers = arena === "options" ? OPTIONS_TIERS : FUTURES_TIERS;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 pb-28 max-w-xl mx-auto space-y-5 font-sans">
      
      {/* Header */}
      <div className="text-center pt-3 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          Pre-Market Risk Commitment
        </div>
        <h1 className="text-2xl font-black text-white">Select Your Trading Arena</h1>
        <p className="text-xs text-slate-400">
          {isLockedToday
            ? "Your daily guardrail is active and locked for today."
            : "Switch arenas and select your daily loss floor. Once locked, it cannot be adjusted until 12:00 AM."}
        </p>
      </div>

      {isLockedToday ? (
        <div className="bg-[#151A23] border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>Guardrail Locked for Today</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
              ACTIVE
            </span>
          </div>

          <div className="bg-[#0B0E14] border border-[#222B3A] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                {lockedArena === "futures" ? "Futures Loss Floor (₹50L Base)" : "Options Daily Loss Floor"}
              </span>
              <span className="text-[10px] text-slate-500">Resets automatically at 12:00 AM Midnight</span>
            </div>
            <span className="text-xl font-mono font-black text-amber-400">
              ₹{lockedLimit.toLocaleString("en-IN")}
            </span>
          </div>

          <button
            onClick={() => navigate({ to: "/terminal" })}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            <span>Enter {lockedArena === "futures" ? "Futures" : "Options"} Terminal</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectArena("options")}
              className={`p-4 rounded-2xl border text-left transition relative ${
                arena === "options"
                  ? "bg-amber-500/10 border-amber-500 text-white shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                  : "bg-[#151A23] border-[#222B3A] text-slate-400 opacity-60 hover:opacity-100"
              }`}
            >
              <Zap className="w-5 h-5 text-amber-400 mb-2" />
              <div className="font-bold text-sm text-white">Options Arena</div>
              <div className="text-[11px] text-slate-400">Fixed ₹ loss tiers</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectArena("futures")}
              className={`p-4 rounded-2xl border text-left transition relative ${
                arena === "futures"
                  ? "bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "bg-[#151A23] border-[#222B3A] text-slate-400 opacity-60 hover:opacity-100"
              }`}
            >
              <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="font-bold text-sm text-white">Futures Arena</div>
              <div className="text-[11px] text-slate-400">% on ₹50L Capital</div>
            </button>
          </div>

          <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Choose Today&apos;s Loss Floor ({arena === "options" ? "Options ₹" : "Futures on ₹50L Base"}):
            </label>

            <div className="space-y-2">
              {activeTiers.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setSelectedLimit(tier.value)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                    selectedLimit === tier.value
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 font-bold"
                      : "bg-[#0B0E14] border-[#222B3A] text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <span className="font-mono text-base">{tier.label}</span>
                  <span className="text-xs text-slate-400 font-sans">{tier.title}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-rose-400/90 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Lock is irreversible until midnight to prevent emotional adjustments.</span>
            </div>
          </div>

          <button
            onClick={handleCommitDailyLock}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl transition"
          >
            <Lock className="w-4 h-4 stroke-[3]" />
            <span>Lock Guardrail &amp; Enter Terminal</span>
          </button>
        </div>
      )}
    </div>
  );
}