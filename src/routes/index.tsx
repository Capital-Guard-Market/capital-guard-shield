import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  loadGuardrailState,
  saveGuardrailState,
  getTodayISTDate,
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
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: GatewayRouteComponent,
});

export function GatewayRouteComponent() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"CHOICE" | "GUARDRAIL_SETUP">("CHOICE");
  const [state, setState] = useState<GuardrailState>(loadGuardrailState());

  const [selectedFuturesPct, setSelectedFuturesPct] = useState<number>(state.futures.selectedTierPct || 10);
  const [selectedOptionsPct, setSelectedOptionsPct] = useState<number>(state.options.selectedTierPct || 10);

  useEffect(() => {
    const current = loadGuardrailState();
    setState(current);
    setSelectedFuturesPct(current.futures.selectedTierPct || 10);
    setSelectedOptionsPct(current.options.selectedTierPct || 10);
  }, []);

  const handleSelectRealm = (realm: "EQUITY" | "FNO") => {
    if (realm === "EQUITY") {
      navigate({ to: "/equity" });
      return;
    }

    if (state.isLocked) {
      navigate({ to: "/terminal" });
    } else {
      setStep("GUARDRAIL_SETUP");
    }
  };

  const handleConfirmAndLock = () => {
    const today = getTodayISTDate();
    const futuresFloor = Math.round(state.futures.capital * (selectedFuturesPct / 100));
    const optionsFloor = Math.round(state.options.capital * (selectedOptionsPct / 100));

    const updated: GuardrailState = {
      ...state,
      isLocked: true,
      lockedDate: today,
      futures: {
        ...state.futures,
        selectedTierPct: selectedFuturesPct,
        selectedFloor: futuresFloor,
      },
      options: {
        ...state.options,
        selectedTierPct: selectedOptionsPct,
        selectedFloor: optionsFloor,
      },
    };

    saveGuardrailState(updated);
    setState(updated);
    navigate({ to: "/terminal" });
  };

  const futuresCap = state.futures.capital;
  const optionsCap = state.options.capital;

  const TIERS = [
    { pct: 5, label: "Conservative / Low Risk", color: "text-amber-400" },
    { pct: 10, label: "Moderate / Standard Risk", color: "text-orange-400" },
    { pct: 20, label: "Aggressive / Max Hard Stop", color: "text-rose-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex items-center justify-center p-4">
      {/* SLIDE 1: REALM SELECTION */}
      {step === "CHOICE" && (
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-wider uppercase text-white flex items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-amber-400" /> Capital Guard Shield
            </h1>
            <p className="text-slate-400 text-sm">
              Select your trading environment. Risk rules operate independently with dynamic rolling capital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Equity Investments Card */}
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
                  Cash delivery holding, non-leveraged long-term investment assets.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span>Enter Investment Realm</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* F&O Derivatives Realm Card */}
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
                  {state.isLocked && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> LOCKED TILL 12 AM
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Futures (₹{futuresCap.toLocaleString("en-IN")}) & Options (₹{optionsCap.toLocaleString("en-IN")}) with independent guardrail selection.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-400">
                <span>{state.isLocked ? "Open Live Terminal" : "Select Today's Guardrails"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE 2: SELECTABLE GUARDRAIL TIER SCREEN */}
      {step === "GUARDRAIL_SETUP" && (
        <div className="max-w-5xl w-full bg-[#151a23] border border-[#22283a] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-[#22283a] pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-400" /> Choose Today's Risk Limits
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select one risk limit for Futures and one for Options. Once submitted, your selection is locked until 12:00 AM Midnight.
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
            {/* Futures Selection Column */}
            <div className="bg-[#0f141d] border border-[#1f2638] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f2638] pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 fill-current" />
                  <h3 className="text-lg font-black text-white">Futures Shield</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Pool: ₹{futuresCap.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Futures Loss Floor:
                </p>

                {TIERS.map((tier) => {
                  const isSelected = selectedFuturesPct === tier.pct;
                  const floorVal = Math.round(futuresCap * (tier.pct / 100));

                  return (
                    <div
                      key={tier.pct}
                      onClick={() => setSelectedFuturesPct(tier.pct)}
                      className={`cursor-pointer flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-[#182030] border-amber-400 ring-1 ring-amber-400 shadow-md"
                          : "bg-[#151a23] border-[#22283a] hover:border-slate-700 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? "bg-amber-400 border-amber-400 text-slate-950"
                              : "border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {tier.pct}% Loss Limit
                          </div>
                          <div className="text-[10px] text-slate-400">{tier.label}</div>
                        </div>
                      </div>

                      <span className={`font-mono font-black text-sm ${tier.color}`}>
                        ₹{floorVal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Options Selection Column */}
            <div className="bg-[#0f141d] border border-[#1f2638] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f2638] pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 fill-current" />
                  <h3 className="text-lg font-black text-white">Options Shield</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Pool: ₹{optionsCap.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Options Loss Floor:
                </p>

                {TIERS.map((tier) => {
                  const isSelected = selectedOptionsPct === tier.pct;
                  const floorVal = Math.round(optionsCap * (tier.pct / 100));

                  return (
                    <div
                      key={tier.pct}
                      onClick={() => setSelectedOptionsPct(tier.pct)}
                      className={`cursor-pointer flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-[#182030] border-amber-400 ring-1 ring-amber-400 shadow-md"
                          : "bg-[#151a23] border-[#22283a] hover:border-slate-700 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? "bg-amber-400 border-amber-400 text-slate-950"
                              : "border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {tier.pct}% Loss Limit
                          </div>
                          <div className="text-[10px] text-slate-400">{tier.label}</div>
                        </div>
                      </div>

                      <span className={`font-mono font-black text-sm ${tier.color}`}>
                        ₹{floorVal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleConfirmAndLock}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                Lock Selected Guardrails (Futures: {selectedFuturesPct}%, Options: {selectedOptionsPct}%)
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GatewayRouteComponent;