import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Zap } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [elapsed, setElapsed] = useState(0); // 0 to 12000 ms
  const [fade, setFade] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // 12-Second Master Timer & Fade-Out
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const current = Date.now() - startTime;
      if (current >= 12000) {
        clearInterval(interval);
        setFade(true);
        setTimeout(onFinish, 500);
      } else {
        setElapsed(current);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onFinish]);

  // Real-Time Canvas Particle Engine (Fire Embers, Ice Shards, Collision Blast)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      // Phase 1: Charge (0s - 6s) - Left Fire Embers & Right Ice Crystals
      if (elapsed < 6000) {
        const progress = elapsed / 6000;
        const bullX = (w * 0.15) + (centerX - w * 0.15) * Math.pow(progress, 2.2);
        const bearX = (w * 0.85) - (w * 0.85 - centerX) * Math.pow(progress, 2.2);

        // Emit Fire particles from Bull
        if (Math.random() < 0.6) {
          particlesRef.current.push({
            x: bullX + (Math.random() * 40 - 20),
            y: centerY + (Math.random() * 80 - 40),
            vx: -Math.random() * 3 - 1,
            vy: (Math.random() - 0.5) * 3,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.4 ? "#F59E0B" : "#EF4444",
            alpha: 1,
            decay: 0.02,
          });
        }

        // Emit Frost particles from Bear
        if (Math.random() < 0.6) {
          particlesRef.current.push({
            x: bearX + (Math.random() * 40 - 20),
            y: centerY + (Math.random() * 80 - 40),
            vx: Math.random() * 3 + 1,
            vy: (Math.random() - 0.5) * 3,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.4 ? "#38BDF8" : "#E0F2FE",
            alpha: 1,
            decay: 0.02,
          });
        }
      }

      // Phase 2: Clash Explosion (6s - 8s) - Huge Radial Blast
      if (elapsed >= 5950 && elapsed <= 8000) {
        if (elapsed <= 6300) {
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            particlesRef.current.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: Math.random() * 6 + 3,
              color: i % 2 === 0 ? "#FCD34D" : i % 3 === 0 ? "#38BDF8" : "#FFFFFF",
              alpha: 1,
              decay: 0.015,
            });
          }
        }
      }

      // Phase 3 & 4 (8s - 12s): Floating Ambient Gold Energy
      if (elapsed > 8000) {
        if (Math.random() < 0.2) {
          particlesRef.current.push({
            x: centerX + (Math.random() * 300 - 150),
            y: centerY + (Math.random() * 200 - 100),
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 1.5 - 0.5,
            size: Math.random() * 3 + 1,
            color: "#FBBF24",
            alpha: 0.8,
            decay: 0.01,
          });
        }
      }

      // Update & Render all particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [elapsed]);

  // Phase Calculations
  const isCharging = elapsed < 6000;
  const isClashing = elapsed >= 6000 && elapsed < 8000;
  const isPillars = elapsed >= 8000 && elapsed < 10000;
  const isCrest = elapsed >= 10000;

  // Charge Position Interp
  const chargeProgress = Math.min(1, elapsed / 6000);
  const leftBullOffset = Math.pow(chargeProgress, 2.5) * 45; // % from left
  const rightBearOffset = Math.pow(chargeProgress, 2.5) * 45; // % from right

  // Pillar Highlights (8s - 10s)
  const pillar1Active = elapsed >= 8000;
  const pillar2Active = elapsed >= 8600;
  const pillar3Active = elapsed >= 9200;

  // Progress Bar %
  const calibrationPercent = Math.min(100, Math.round((elapsed / 12000) * 100));

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0B0E14] overflow-hidden flex flex-col items-center justify-center transition-opacity duration-500 select-none ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Dynamic Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1E2638]/40 via-[#0B0E14]/90 to-[#0B0E14] pointer-events-none" />

      {/* ⚡ PHASE 1: BULL & BEAR CHARGE (0s - 6s) */}
      {isCharging && (
        <div className="relative w-full h-full flex items-center justify-between px-6 z-20">
          
          {/* Raging Fire Bull (Left) */}
          <div
            className="absolute flex flex-col items-center transition-transform"
            style={{
              left: `${8 + leftBullOffset}%`,
              transform: `translateY(-50%) scale(${1 + chargeProgress * 0.3})`,
              top: "50%",
            }}
          >
            <div className="relative p-6 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/30 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)] animate-pulse">
              {/* Stylized Fiery Bull SVG */}
              <svg className="w-16 h-16 sm:w-24 sm:h-24 text-amber-400 fill-current drop-shadow-[0_0_15px_#F59E0B]" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <span className="mt-3 font-mono font-black text-xs uppercase tracking-widest text-amber-400 drop-shadow-[0_0_8px_#F59E0B]">
              BULLISH FORCE
            </span>
          </div>

          {/* Raging Ice Bear (Right) */}
          <div
            className="absolute flex flex-col items-center transition-transform"
            style={{
              right: `${8 + rightBearOffset}%`,
              transform: `translateY(-50%) scale(${1 + chargeProgress * 0.3})`,
              top: "50%",
            }}
          >
            <div className="relative p-6 rounded-full bg-gradient-to-l from-sky-500/20 to-blue-600/30 border-2 border-sky-400 shadow-[0_0_50px_rgba(56,189,248,0.6)] animate-pulse">
              {/* Stylized Ice Bear SVG */}
              <svg className="w-16 h-16 sm:w-24 sm:h-24 text-sky-400 fill-current drop-shadow-[0_0_15px_#38BDF8]" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
              </svg>
            </div>
            <span className="mt-3 font-mono font-black text-xs uppercase tracking-widest text-sky-400 drop-shadow-[0_0_8px_#38BDF8]">
              BEARISH PRESSURE
            </span>
          </div>

          {/* Versus Center Glow */}
          <div className="mx-auto text-slate-500 font-mono font-black text-lg opacity-40">
            VS
          </div>
        </div>
      )}

      {/* 💥 PHASE 2: THE KINETIC CLASH FLASH (6s - 8s) */}
      {isClashing && (
        <div className="relative z-20 flex flex-col items-center justify-center">
          <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-white animate-ping opacity-75 blur-md" />
          <div className="absolute p-8 rounded-full bg-gradient-to-tr from-amber-400 via-white to-sky-400 shadow-[0_0_120px_rgba(255,255,255,0.9)] animate-pulse">
            <Zap className="w-20 h-20 text-slate-950 stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* 🛡️ PHASE 3: THE 3 SEQUENTIAL PILLARS (8s - 10s) */}
      {isPillars && (
        <div className="relative z-20 flex flex-col items-center space-y-4 max-w-md px-6 text-center">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            Risk Calibration Engine Armed
          </span>

          <div
            className={`w-full py-3 px-5 rounded-2xl border transition-all duration-300 font-black text-xs sm:text-sm tracking-wider uppercase ${
              pillar1Active
                ? "bg-amber-500/10 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.3)] scale-105"
                : "opacity-0 scale-95"
            }`}
          >
            ✦ PRACTICE WITH CONSEQUENCES
          </div>

          <div
            className={`w-full py-3 px-5 rounded-2xl border transition-all duration-300 font-black text-xs sm:text-sm tracking-wider uppercase ${
              pillar2Active
                ? "bg-sky-500/10 border-sky-400 text-sky-300 shadow-[0_0_25px_rgba(56,189,248,0.3)] scale-105"
                : "opacity-0 scale-95"
            }`}
          >
            ✦ FINANCIAL SHIELD
          </div>

          <div
            className={`w-full py-3 px-5 rounded-2xl border transition-all duration-300 font-black text-xs sm:text-sm tracking-wider uppercase ${
              pillar3Active
                ? "bg-emerald-500/10 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-105"
                : "opacity-0 scale-95"
            }`}
          >
            ✦ SECURE FUTURE
          </div>
        </div>
      )}

      {/* 🏆 PHASE 4: THE CAPITALGUARD METALLIC EMBLEM REVEAL (10s - 12s) */}
      {isCrest && (
        <div className="relative z-20 flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500 text-center px-4">
          
          {/* Metallic Crest Emblem */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-b from-[#1E2638] to-[#0B0E14] border-2 border-amber-400/80 shadow-[0_0_60px_rgba(251,191,36,0.4)]">
            <ShieldCheck className="w-20 h-20 text-amber-400 filter drop-shadow-[0_0_20px_#F59E0B]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              CAPITALGUARD
            </h1>
            <p className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase">
              UNBREACHABLE RISK ENGINE
            </p>
          </div>
        </div>
      )}

      {/* ⏱️ BOTTOM CALIBRATION PROGRESS BAR (0% -> 100%) */}
      <div className="absolute bottom-8 left-6 right-6 max-w-sm mx-auto z-20 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Calibrating Risk Shield...</span>
          <span className="text-amber-400 font-bold">{calibrationPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#151A23] rounded-full overflow-hidden border border-[#222B3A]">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all duration-75"
            style={{ width: `${calibrationPercent}%` }}
          />
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={() => {
          setFade(true);
          setTimeout(onFinish, 300);
        }}
        className="absolute top-6 right-6 z-30 px-3.5 py-1.5 rounded-full bg-[#151A23]/80 backdrop-blur-md border border-[#222B3A] text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        Skip Intro
      </button>
    </div>
  );
}