import { useState, useEffect } from "react";
import { ShieldCheck, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [stage, setStage] = useState<"charging" | "impact" | "reveal" | "fadeout">("charging");

  useEffect(() => {
    // Timeline of the clash animation
    const t1 = setTimeout(() => setStage("impact"), 800);   // Bull & Bear hit center
    const t2 = setTimeout(() => setStage("reveal"), 1300);  // CapitalGuard shield emerges
    const t3 = setTimeout(() => setStage("fadeout"), 2500); // Screen fades out
    const t4 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#07090E] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 select-none ${
        stage === "fadeout" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent opacity-50" />

      <div className="relative w-full max-w-md h-64 flex items-center justify-center">
        {/* GREEN BULL (Charges from Left) */}
        <div
          className={`absolute flex flex-col items-center transition-all duration-700 ease-out transform ${
            stage === "charging"
              ? "-translate-x-48 opacity-20 scale-75 text-emerald-500"
              : stage === "impact"
              ? "-translate-x-6 scale-125 text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.9)]"
              : "-translate-x-24 opacity-0 scale-50 text-emerald-600"
          }`}
        >
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl shadow-xl backdrop-blur-md">
            <TrendingUp className="w-10 h-10 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-black tracking-widest text-emerald-400 mt-2 font-mono">BULL</span>
        </div>

        {/* RED BEAR (Charges from Right) */}
        <div
          className={`absolute flex flex-col items-center transition-all duration-700 ease-out transform ${
            stage === "charging"
              ? "translate-x-48 opacity-20 scale-75 text-rose-500"
              : stage === "impact"
              ? "translate-x-6 scale-125 text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.9)]"
              : "translate-x-24 opacity-0 scale-50 text-rose-600"
          }`}
        >
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl shadow-xl backdrop-blur-md">
            <TrendingDown className="w-10 h-10 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-black tracking-widest text-rose-400 mt-2 font-mono">BEAR</span>
        </div>

        {/* IMPACT SHOCKWAVE & FLASH */}
        {stage === "impact" && (
          <div className="absolute inset-0 flex items-center justify-center animate-ping pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-amber-400/40 blur-xl" />
          </div>
        )}

        {/* CAPITALGUARD BRAND LOGO REVEAL (Emerges from Center Impact) */}
        <div
          className={`absolute flex flex-col items-center transition-all duration-700 ease-out transform ${
            stage === "reveal" || stage === "fadeout"
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-50 opacity-0 translate-y-8"
          }`}
        >
          <div className="relative p-4 rounded-3xl bg-gradient-to-b from-amber-400/20 to-amber-600/5 border-2 border-amber-400/60 shadow-[0_0_40px_rgba(251,191,36,0.3)] backdrop-blur-xl">
            <ShieldCheck className="w-14 h-14 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <div className="text-center mt-3 space-y-1">
            <h1 className="text-2xl font-black tracking-widest text-white uppercase font-sans drop-shadow-md">
              CAPITAL<span className="text-amber-400">GUARD</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-slate-400 font-mono">
              Unbreachable Risk Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}