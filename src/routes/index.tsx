import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  loadGuardrailState,
  saveGuardrailState,
  getTodayISTDate,
  getNextMidnightIST,
  GuardrailState,
} from "../lib/guardrailStore";
import {
  ShieldAlert,
  Lock,
  Zap,
  Flame,
  LineChart,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: GatewayRouteComponent,
});

export function GatewayRouteComponent() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"CHOICE" | "GUARDRAIL_SETUP">("CHOICE");
  const [guardrail, setGuardrail] = useState<GuardrailState>(loadGuardrailState());

  const [futuresLossCap, setFuturesLossCap] = useState<number>(() =>
    Math.round(guardrail.futures.capital * 0.20)
  );
  const [optionsLossCap, setOptionsLossCap] = useState<number>(() =>
    Math.round(guardrail.options.capital * 0.20)
  );

  useEffect(() => {
    const current = loadGuardrailState();
    setGuardrail(current);
    setFuturesLossCap(Math.round(current.futures.capital * 0.20));
    setOptionsLossCap(Math.round(current.options.capital * 0.20));
  }, []);

  const handleSelectRealm = (realm: "EQUITY" | "FNO") => {
    if (realm === "EQUITY") {
      navigate({ to: "/equity" });
      return;
    }

    if (guardrail.isLocked) {
      navigate({ to: "/terminal" });
    } else {
      setStep("GUARDRAIL_SETUP");
    }
  };

  const handleLockAndSubmit = () => {
    const today = getTodayISTDate();
    const midnight = getNextMidnightIST();

    const maxFuturesAllowed = Math.round(guardrail.futures.capital * 0.20);
    const maxOptionsAllowed = Math.round(guardrail.options.capital * 0.20);

    const updatedState: GuardrailState = {
      ...guardrail,
      isLocked: true,
      lockedDate: today,
      expiresAt: midnight,
      futures: {
        ...guardrail.futures,
        maxDailyLoss: Math.min(futuresLossCap, maxFuturesAllowed),
      },
      options: {
        ...guardrail.options,
        maxDailyLoss: Math.min(optionsLossCap, maxOptionsAllowed),
      },
    };

    saveGuardrailState(updatedState);
    setGuardrail(updatedState);
    navigate({ to: "/terminal" });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center p-4">
      {step === "CHOICE" && (
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-wider uppercase text-white flex items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-amber-400" /> Capital Guard Shield
            </h1>
            <p className="text-slate-400 text-sm">
              Select your execution environment. Guardrails operate with strict non-overlapping capital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div
              onClick={() => handleSelectRealm("EQUITY")}
              className="cursor-pointer bg-[#151a23] hover:bg-[#1a2130] border border-[#22283a] hover:border-emerald-500/50 p-6 rounded-3xl transition-all shadow-xl group space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Equity Investments (Home)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cash delivery holding, non-leveraged equity assets, safe portfolio view.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span>Enter Investment Realm</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => handleSelectRealm("FNO")}
              className="cursor-pointer bg-[#151a23] hover:bg-[#1a2130] border border-[#22283a] hover:border-amber-500/50 p-6 rounded-3xl transition-all shadow-xl group space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">F&O Derivatives Realm</h3>
                  {guardrail.isLocked && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> LOCKED TILL 12 AM
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamic Rolling Capital: Futures (₹{guardrail.futures.capital.toLocaleString("en-IN")}) & Options (₹{guardrail.options.capital.toLocaleString("en-IN")}).
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-400">
                <span>{guardrail.isLocked ? "Open Live Terminal" : "Configure & Lock Guardrail"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "GUARDRAIL_SETUP" && (
        <div className="max-w-5xl w-full bg-[#151a23] border border-[#22283a] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-[#22283a] pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-400" /> Daily Guardrail Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Risk limits operate independently on rolling leftover capital. Locked until 12:00 AM Midnight.
              </p>
            </div>
            <button
              onClick={() => setStep("CHOICE")}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-[#1c2331]"
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Futures Guardrail */}
            <div className="bg-[#0f141d] border border-[#1f2638] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 fill-current" />
                  <h3 className="text-lg font-black text-white">Futures Shield</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Pool: ₹{guardrail.futures.capital.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-[#151a23]">
                  <span className="text-slate-400">Tier 1 (5% Caution):</span>
                  <span className="text-amber-400 font-bold font-mono">
                    ₹{Math.round(guardrail.futures.capital * 0.05).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#151a23]">
                  <span className="text-slate-400">Tier 2 (10% Restrict):</span>
                  <span className="text-orange-400 font-bold font-mono">
                    ₹{Math.round(guardrail.futures.capital * 0.10).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#151a23]">
                  <span className="text-slate-400">Tier 3 (20% Max Hard Stop):</span>
                  <span className="text-rose-400 font-bold font-mono">
                    ₹{Math.round(guardrail.futures.capital * 0.20).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-300">
                  Custom Loss Floor (Max 20% / ₹{Math.round(guardrail.futures.capital * 0.20).toLocaleString("en-IN")}):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    max={Math.round(guardrail.futures.capital * 0.20)}
                    value={futuresLossCap}
                    onChange={(e) => setFuturesLossCap(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#151a23] border border-[#2c354a] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Options Guardrail */}
            <div className="bg-[#0f141d] border border-[#1f2638] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 fill-current" />
                  <h3 className="text-lg font-black text-white">Options Shield</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Pool: ₹{guardrail.options.capital.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-[#151a23]">
                  <span className="text-slate-400">Tier 1 (5% Caution):</span>
                  <span className="text-amber-400 font-bold font-mono">
                    ₹{Math.round(guardrail.options.capital * 0.05).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#151a23]">
                  <span className="text-slate-400">Tier 2 (10% Restrict):</span>
                  <span className="text-orange-400 font-bold font-mono">
                    ₹{Math.round(guardrail.options.capital * 0.10).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#151a23]">
                  <span className="text-slate-400">Tier 3 (20% Max Hard Stop):</span>
                  <span className="text-rose-400 font-bold font-mono">
                    ₹{Math.round(guardrail.options.capital * 0.20).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-300">
                  Custom Loss Floor (Max 20% / ₹{Math.round(guardrail.options.capital * 0.20).toLocaleString("en-IN")}):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    max={Math.round(guardrail.options.capital * 0.20)}
                    value={optionsLossCap}
                    onChange={(e) => setOptionsLossCap(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#151a23] border border-[#2c354a] text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleLockAndSubmit}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Lock Guardrail & Enter Terminal (Locked Till 12 AM)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GatewayRouteComponent;