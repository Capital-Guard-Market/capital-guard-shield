import { useEffect, useRef, useState } from "react";

const DURATION = 5000;

function statusFor(pct: number) {
  const t = (pct / 100) * 5;
  if (t < 2) return "Loading Market Feeds...";
  if (t < 4) return "Calibrating Risk Shield...";
  return "Shield Engine Ready.";
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 400);
  };

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / DURATION) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-[#0B0F19] transition-opacity duration-[400ms] ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <button
        onClick={finish}
        className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/20"
      >
        Skip ➔
      </button>

      <video
        src="/splash.mp4"
        autoPlay
        muted
        playsInline
        onEnded={finish}
        className="h-full w-full flex-1 object-contain"
      />

      <div className="absolute inset-x-0 bottom-0 px-6 pb-10">
        <div className="mx-auto max-w-md">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FACC15] to-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.7)] transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="num mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/70">
            <span>{statusFor(progress)}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
